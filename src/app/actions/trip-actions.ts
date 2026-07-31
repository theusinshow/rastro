'use server'

import { revalidatePath } from 'next/cache'
import { civilDateInTimeZone } from '@/domain/dates'
import { MINUTES_PER_STOP, TIME_BUDGET_MINUTES } from '@/domain/discovery'
import { planRefuelStops, type RefuelPlan } from '@/domain/fuel'
import type { Coordinates } from '@/domain/geo'
import {
  ITINERARY_REFUSAL_MESSAGES,
  buildItinerary,
  isRefusal,
  orderAndMeasure,
  type ItineraryRequest,
} from '@/domain/itinerary'
import { slugify, uniqueSlug } from '@/domain/slug'
import {
  getPlaceRepository,
  getProfileRepository,
  getTripRepository,
} from '@/lib/data'
import { getRoutingClient } from '@/lib/routing'
import type { ActionResult } from './result'

/** Fuso do produto. O `dates.ts` já assume o mesmo contexto catarinense. */
const TIME_ZONE = 'America/Sao_Paulo'

/** Data civil de hoje neste fuso, para a pontuação de recência e para a visita. */
function today(): string {
  return civilDateInTimeZone(new Date().toISOString(), TIME_ZONE)
}

const NO_ORIGIN = 'Defina sua origem no perfil antes de montar um roteiro.'

export interface ProposedItinerary {
  ok: true
  stops: { id: string; name: string }[]
  roadKm: number
  minutes: number
  /**
   * `true` quando os números vieram do fator de sinuosidade, não da estrada.
   *
   * A interface é obrigada a dizer qual dos dois está mostrando — mesma regra que
   * impede apresentar dado de `src/mocks/` como verificado.
   */
  estimated: boolean
  /** Minutos parados: `paradas × MINUTES_PER_STOP`. */
  stoppedMinutes: number
  /** Minutos que o usuário pediu. Permite comparar o pedido com o real. */
  budgetMinutes: number
  /**
   * Plano de abastecimento. `null` quando a autonomia não foi informada — e aí
   * o produto não opina sobre combustível.
   */
  refuel: RefuelPlan | null
}

type ProposalOutcome = ProposedItinerary | { ok: false; message: string }

type ProposalInput = Omit<ItineraryRequest, 'origin'>

/**
 * Mede a rota real das paradas, quando possível.
 *
 * Existe porque medir DEPOIS de salvar chegava tarde demais: o usuário escolhia
 * com a estimativa e só descobria o número verdadeiro com a viagem já criada. Um
 * passeio proposto como 3h16 virava 6h53 de estrada — o produto mentia
 * exatamente no momento da decisão.
 *
 * A cota do provedor é de 2.000 chamadas por dia; propor um roteiro custa uma.
 */
async function measureOnRoad(
  origin: Coordinates,
  stops: readonly Coordinates[],
): Promise<{ roadKm: number; minutes: number } | null> {
  const routing = getRoutingClient()
  if (!routing) return null

  const routed = await routing.route([origin, ...stops, origin])
  if (!routed) return null

  return { roadKm: routed.roadKm, minutes: routed.minutes }
}

/**
 * Monta um roteiro e o devolve para revisão, sem gravar nada.
 *
 * Propor não é salvar: quem pediu uma sugestão pode simplesmente não gostar dela,
 * e criar viagem no banco a cada tentativa encheria o histórico de rascunho que
 * ninguém pediu.
 */
export async function proposeTripAction(
  input: ProposalInput,
): Promise<ProposalOutcome> {
  const profileRepository = await getProfileRepository()
  const profile = await profileRepository.getProfile()

  if (!profile?.home) return { ok: false, message: NO_ORIGIN }

  const placeRepository = await getPlaceRepository()
  const places = await placeRepository.listExplorePlaces()

  const outcome = buildItinerary(
    places,
    { ...input, origin: profile.home },
    today(),
  )

  if (isRefusal(outcome)) {
    return { ok: false, message: ITINERARY_REFUSAL_MESSAGES[outcome.refusal] }
  }

  const measured = await measureOnRoad(profile.home, outcome.stops)
  const roadKm = measured?.roadKm ?? outcome.totalRoadKm

  return {
    ok: true,
    stops: outcome.stops.map((place) => ({ id: place.id, name: place.name })),
    roadKm,
    minutes: measured?.minutes ?? outcome.totalRidingMinutes,
    estimated: measured === null,
    stoppedMinutes: outcome.stops.length * MINUTES_PER_STOP,
    budgetMinutes: TIME_BUDGET_MINUTES[input.timeBudget],
    refuel: planRefuelStops(roadKm, profile.autonomyKm),
  }
}

/**
 * Ordena e mede um conjunto de paradas escolhido à mão, sem gravar nada.
 *
 * Separada de `proposeTripAction` porque aqui NÃO há seleção: o usuário já
 * escolheu, e o único trabalho é ordenar e medir. Reaproveitar a outra faria a
 * pontuação de interesse descartar parada que a pessoa pediu explicitamente.
 */
export async function measureTripAction(
  placeIds: string[],
): Promise<ProposalOutcome> {
  const profileRepository = await getProfileRepository()
  const profile = await profileRepository.getProfile()

  if (!profile?.home) return { ok: false, message: NO_ORIGIN }

  const placeRepository = await getPlaceRepository()
  const all = await placeRepository.listExplorePlaces()
  const chosen = all.filter((place) => placeIds.includes(place.id))

  if (chosen.length === 0) {
    return { ok: false, message: 'Nenhuma das paradas escolhidas existe.' }
  }

  const itinerary = orderAndMeasure(profile.home, chosen)
  const measured = await measureOnRoad(profile.home, itinerary.stops)
  const roadKm = measured?.roadKm ?? itinerary.totalRoadKm

  return {
    ok: true,
    stops: itinerary.stops.map((place) => ({ id: place.id, name: place.name })),
    roadKm,
    minutes: measured?.minutes ?? itinerary.totalRidingMinutes,
    estimated: measured === null,
    stoppedMinutes: itinerary.stops.length * MINUTES_PER_STOP,
    // Montagem à mão não tem orçamento pedido: não há o que estourar.
    budgetMinutes: 0,
    refuel: planRefuelStops(roadKm, profile.autonomyKm),
  }
}

/**
 * Grava a viagem a partir dos ids das paradas que o usuário aprovou.
 *
 * A ordem vem do domínio, não do cliente: `orderAndMeasure` reordena o que
 * chegar. Confiar na ordem enviada pelo navegador deixaria a regra de ordenação
 * fora do domínio.
 */
export async function createTripAction(input: {
  title: string
  placeIds: string[]
}): Promise<ActionResult & { slug?: string }> {
  const title = input.title.trim()
  if (!title) return { ok: false, message: 'Dê um nome à viagem.' }
  if (input.placeIds.length === 0) {
    return { ok: false, message: 'Escolha pelo menos uma parada.' }
  }

  try {
    const profileRepository = await getProfileRepository()
    const profile = await profileRepository.getProfile()
    if (!profile?.home) return { ok: false, message: NO_ORIGIN }

    const placeRepository = await getPlaceRepository()
    const all = await placeRepository.listExplorePlaces()
    const chosen = all.filter((place) => input.placeIds.includes(place.id))

    if (chosen.length === 0) {
      return { ok: false, message: 'Nenhuma das paradas escolhidas existe.' }
    }

    const itinerary = orderAndMeasure(profile.home, chosen)

    // Traçado real quando possível. `null` cobre sem-chave, rede fora e cota
    // estourada, e nesse caso os números seguem sendo os estimados do domínio —
    // com `route_geojson` nulo, que é o sinal de "estimado" na interface.
    const routing = getRoutingClient()
    const routed = routing
      ? await routing.route([profile.home, ...itinerary.stops, profile.home])
      : null

    const repository = await getTripRepository()
    const taken = await repository.listSlugs()
    const slug = uniqueSlug(slugify(title), taken)

    const trip = await repository.createTrip(
      {
        title,
        originLabel: profile.homeLabel,
        originCoordinates: profile.home,
        stops: itinerary.stops.map((place) => ({
          placeId: place.id,
          label: place.name,
          coordinates: { latitude: place.latitude, longitude: place.longitude },
          kind: 'waypoint' as const,
        })),
        distanceKm: routed?.roadKm ?? itinerary.totalRoadKm,
        durationMinutes: routed?.minutes ?? itinerary.totalRidingMinutes,
        routeGeoJson: routed?.geometry ?? null,
      },
      slug,
    )

    revalidatePath('/', 'layout')
    return { ok: true, slug: trip.slug }
  } catch {
    return { ok: false, message: 'Não foi possível salvar a viagem.' }
  }
}

/**
 * Conclui a viagem registrando visita só nas paradas confirmadas.
 *
 * Lista vazia é permitida: você rodou e tudo estava fechado. Isso é um fato, e o
 * produto não vai discutir com ele.
 */
export async function completeTripAction(
  tripId: string,
  confirmedStopIds: string[],
): Promise<ActionResult> {
  try {
    const repository = await getTripRepository()
    await repository.completeTrip(tripId, confirmedStopIds, today())
  } catch {
    return { ok: false, message: 'Não foi possível concluir a viagem.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function deleteTripAction(tripId: string): Promise<ActionResult> {
  try {
    const repository = await getTripRepository()
    await repository.deleteTrip(tripId)
  } catch {
    return { ok: false, message: 'Não foi possível apagar a viagem.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}
