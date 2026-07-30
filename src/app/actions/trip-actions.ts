'use server'

import { revalidatePath } from 'next/cache'
import { civilDateInTimeZone } from '@/domain/dates'
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
}

type ProposalOutcome = ProposedItinerary | { ok: false; message: string }

type ProposalInput = Omit<ItineraryRequest, 'origin'>

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

  return {
    ok: true,
    stops: outcome.stops.map((place) => ({ id: place.id, name: place.name })),
    roadKm: outcome.totalRoadKm,
    minutes: outcome.totalRidingMinutes,
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

  return {
    ok: true,
    stops: itinerary.stops.map((place) => ({ id: place.id, name: place.name })),
    roadKm: itinerary.totalRoadKm,
    minutes: itinerary.totalRidingMinutes,
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
