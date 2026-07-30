import {
  MINUTES_PER_STOP,
  TIME_BUDGET_MINUTES,
  estimateRidingMinutes,
  estimateRoadKm,
  type TimeBudget,
} from './discovery'
import { haversineKm, type Coordinates } from './geo'
import type { ExplorePlace, PlaceCategory } from './place'

/**
 * Pontuação de interesse de um lugar como parada de um roteiro.
 *
 * Esta é a informação que o Rastro tem e um otimizador genérico não: o que você
 * marcou como quero-conhecer, o que ainda não viu, e há quanto tempo não volta.
 * É por isso que a ORDEM das paradas pode ser delegada à geometria, mas a
 * ESCOLHA delas não.
 */
export const SCORE_WANTS_TO_VISIT = 100
export const SCORE_UNVISITED = 60
export const SCORE_VISITED = 20
export const SCORE_FAVORITE_BONUS = 25

/** Máximo que a idade da última visita soma a um lugar já visitado. */
export const SCORE_STALENESS_MAX = 30

/** A partir daqui a visita é "antiga" e o bônus para de crescer. */
export const STALENESS_SATURATION_MONTHS = 24

const DAYS_PER_MONTH = 30.44
const MS_PER_DAY = 86_400_000

/**
 * Meses inteiros entre duas datas civis `YYYY-MM-DD`.
 *
 * O parse ancora ao meio-dia UTC pelo mesmo motivo do `dates.ts`:
 * `new Date('2026-07-26')` é meia-noite UTC e, no fuso de Brasília, cai no dia
 * anterior. Isto é conta de calendário, e o meio-dia deixa a diferença imune a
 * qualquer deslocamento de fuso.
 */
function monthsBetween(fromIsoDate: string, toIsoDate: string): number {
  const from = Date.parse(`${fromIsoDate}T12:00:00Z`)
  const to = Date.parse(`${toIsoDate}T12:00:00Z`)
  if (Number.isNaN(from) || Number.isNaN(to)) return 0

  const days = (to - from) / MS_PER_DAY
  return Math.max(0, days / DAYS_PER_MONTH)
}

/**
 * Voltar a um lugar tem valor, e voltar a um lugar que você não vê há dois anos
 * tem mais. Satura de propósito: sem teto, um lugar visitado em 1990 venceria um
 * quero-conhecer, e o roteiro deixaria de servir a quem quer conhecer coisa nova.
 *
 * `today` é `YYYY-MM-DD` e entra por parâmetro, não de `new Date()` aqui: é o que
 * mantém a função pura e testável.
 */
export function scorePlace(place: ExplorePlace, today: string): number {
  let score = 0

  if (place.visitStatus === 'quero-conhecer') {
    score += SCORE_WANTS_TO_VISIT
  } else if (place.visitStatus === 'nao-visitado') {
    score += SCORE_UNVISITED
  } else {
    score += SCORE_VISITED
    if (place.lastVisitedAt) {
      const months = monthsBetween(place.lastVisitedAt, today)
      const ratio = Math.min(1, months / STALENESS_SATURATION_MONTHS)
      score += ratio * SCORE_STALENESS_MAX
    }
  }

  if (place.isFavorite) score += SCORE_FAVORITE_BONUS

  return score
}

export interface ItineraryLeg {
  /** Índice da parada de onde o trecho sai. `-1` é a origem. */
  fromStopIndex: number
  roadKm: number
  minutes: number
}

export interface Itinerary {
  /** Já na ordem de rodagem. */
  stops: ExplorePlace[]
  /** Inclui o trecho de volta à origem. */
  legs: ItineraryLeg[]
  totalRoadKm: number
  totalRidingMinutes: number
}

/** Quilômetros rodoviários estimados de um ciclo fechado origem → pontos → origem. */
function cycleRoadKm(
  origin: Coordinates,
  stops: readonly Coordinates[],
): number {
  let total = 0
  let previous: Coordinates = origin

  for (const stop of stops) {
    total += estimateRoadKm(haversineKm(previous, stop))
    previous = stop
  }

  return total + estimateRoadKm(haversineKm(previous, origin))
}

/**
 * Vizinho-mais-próximo a partir da origem.
 *
 * É o ponto de partida do 2-opt, não a resposta: sozinho ele produz um caminho
 * que às vezes cruza consigo mesmo.
 */
function nearestNeighbourOrder(
  origin: Coordinates,
  stops: readonly ExplorePlace[],
): ExplorePlace[] {
  const remaining = [...stops]
  const ordered: ExplorePlace[] = []
  let current: Coordinates = origin

  while (remaining.length > 0) {
    let bestIndex = 0
    let bestKm = Infinity

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i]
      if (!candidate) continue
      const km = haversineKm(current, candidate)
      if (km < bestKm) {
        bestKm = km
        bestIndex = i
      }
    }

    const [chosen] = remaining.splice(bestIndex, 1)
    if (!chosen) break
    ordered.push(chosen)
    current = chosen
  }

  return ordered
}

/**
 * 2-opt sobre o ciclo fechado: inverte trechos enquanto isso encurtar o total.
 *
 * Com algumas dezenas de paradas isto roda em microssegundos, e é o que desfaz os
 * cruzamentos que o vizinho-mais-próximo deixa. Não busca o ótimo global — busca
 * um caminho que não pareça errado a olho no mapa, que é o que importa aqui.
 */
function twoOptImprove(
  origin: Coordinates,
  stops: readonly ExplorePlace[],
): ExplorePlace[] {
  let best = [...stops]
  let bestKm = cycleRoadKm(origin, best)
  let improved = true

  while (improved) {
    improved = false

    for (let i = 0; i < best.length - 1; i += 1) {
      for (let j = i + 1; j < best.length; j += 1) {
        const candidate = [
          ...best.slice(0, i),
          ...best.slice(i, j + 1).reverse(),
          ...best.slice(j + 1),
        ]
        const km = cycleRoadKm(origin, candidate)
        if (km < bestKm - 1e-9) {
          best = candidate
          bestKm = km
          improved = true
        }
      }
    }
  }

  return best
}

/**
 * Ordena um conjunto de paradas já escolhido e mede os trechos.
 *
 * É o que a montagem manual usa: nenhuma seleção, só geometria. A ordem nunca é
 * a que o usuário informou — ordenar é trabalho de máquina, e o 2-opt faz melhor
 * que a mão.
 */
export function orderAndMeasure(
  origin: Coordinates,
  stops: readonly ExplorePlace[],
): Itinerary {
  if (stops.length === 0) {
    return { stops: [], legs: [], totalRoadKm: 0, totalRidingMinutes: 0 }
  }

  const ordered = twoOptImprove(origin, nearestNeighbourOrder(origin, stops))

  const legs: ItineraryLeg[] = []
  let previous: Coordinates = origin

  ordered.forEach((stop, index) => {
    const roadKm = estimateRoadKm(haversineKm(previous, stop))
    legs.push({
      fromStopIndex: index - 1,
      roadKm,
      minutes: estimateRidingMinutes(roadKm),
    })
    previous = stop
  })

  const returnKm = estimateRoadKm(haversineKm(previous, origin))
  legs.push({
    fromStopIndex: ordered.length - 1,
    roadKm: returnKm,
    minutes: estimateRidingMinutes(returnKm),
  })

  const totalRoadKm = legs.reduce((sum, leg) => sum + leg.roadKm, 0)

  return {
    stops: ordered,
    legs,
    totalRoadKm,
    totalRidingMinutes: estimateRidingMinutes(totalRoadKm),
  }
}

export interface ItineraryRequest {
  origin: Coordinates
  timeBudget: TimeBudget
  /** Limite de distância rodoviária estimada, só de ida. */
  maxDistanceKm: number
  /** Vazio significa qualquer categoria. */
  categories: PlaceCategory[]
  /** Parada obrigatória, quando o usuário já sabe o destino. */
  anchorPlaceId: string | null
  maxStops: number
}

/**
 * As três recusas são distintas e rendem mensagens diferentes.
 *
 * Confundi-las devolveria ao usuário o trabalho de descobrir o que deu errado — e
 * sugerir "aumente o raio" quando o problema é tempo o mandaria para o lado
 * errado.
 */
export type ItineraryRefusal =
  /** Nada passou pelos filtros de categoria e raio. Nem chegou a medir tempo. */
  | 'no-candidates'
  /** Passou pelos filtros, mas nem a parada mais próxima cabe no tempo. */
  | 'budget-too-small'
  /** Só a âncora, sozinha, já estoura o orçamento. */
  | 'anchor-does-not-fit'

export type ItineraryOutcome = Itinerary | { refusal: ItineraryRefusal }

export function isRefusal(
  outcome: ItineraryOutcome,
): outcome is { refusal: ItineraryRefusal } {
  return 'refusal' in outcome
}

/** Minutos de pilotagem disponíveis, já descontado o tempo parado. */
function ridingBudgetMinutes(budget: TimeBudget, stopCount: number): number {
  return TIME_BUDGET_MINUTES[budget] - stopCount * MINUTES_PER_STOP
}

function fits(itinerary: Itinerary, budget: TimeBudget): boolean {
  return (
    itinerary.totalRidingMinutes <=
    ridingBudgetMinutes(budget, itinerary.stops.length)
  )
}

/**
 * Monta o roteiro: seleciona por interesse, ordena por geometria, e poda até
 * caber.
 *
 * A poda descarta sempre a parada de MENOR pontuação e reordena — nunca a
 * âncora, que é o destino que o usuário já escolheu. Se só ela não cabe, a recusa
 * diz isso em vez de devolver uma lista vazia.
 */
export function buildItinerary(
  places: readonly ExplorePlace[],
  request: ItineraryRequest,
  today: string,
): ItineraryOutcome {
  const anchor = request.anchorPlaceId
    ? places.find((place) => place.id === request.anchorPlaceId)
    : undefined

  const candidates = places.filter((place) => {
    if (place.id === anchor?.id) return false
    if (
      request.categories.length > 0 &&
      !request.categories.includes(place.category)
    ) {
      return false
    }
    return (
      estimateRoadKm(haversineKm(request.origin, place)) <= request.maxDistanceKm
    )
  })

  if (!anchor && candidates.length === 0) return { refusal: 'no-candidates' }

  if (anchor) {
    const alone = orderAndMeasure(request.origin, [anchor])
    if (!fits(alone, request.timeBudget)) {
      return { refusal: 'anchor-does-not-fit' }
    }
  }

  const ranked = [...candidates].sort(
    (a, b) => scorePlace(b, today) - scorePlace(a, today),
  )

  const room = anchor ? request.maxStops - 1 : request.maxStops
  const selected = [
    ...(anchor ? [anchor] : []),
    ...ranked.slice(0, Math.max(0, room)),
  ]

  // Poda: enquanto não couber, sai a de menor pontuação que não seja a âncora.
  let working = selected
  while (working.length > 0) {
    const itinerary = orderAndMeasure(request.origin, working)
    if (fits(itinerary, request.timeBudget)) return itinerary

    const droppable = working.filter((place) => place.id !== anchor?.id)
    if (droppable.length === 0) return { refusal: 'anchor-does-not-fit' }

    // Sai a de menor pontuação. Empate desempata pelo CUSTO: entre duas paradas
    // igualmente interessantes, quem sai é a mais longe.
    //
    // Sem esse desempate a poda descartava em ordem de array, e como candidatos
    // sem visita e sem favorito pontuam igual, ela removia a parada mais próxima
    // e mantinha as caras — o roteiro encolhia sem nunca passar a caber, e um
    // passeio perfeitamente possível era recusado.
    let worst = droppable[0]
    if (!worst) break
    let worstScore = scorePlace(worst, today)
    let worstKm = haversineKm(request.origin, worst)

    for (const place of droppable) {
      const score = scorePlace(place, today)
      const km = haversineKm(request.origin, place)
      if (score < worstScore || (score === worstScore && km > worstKm)) {
        worst = place
        worstScore = score
        worstKm = km
      }
    }

    const worstId = worst.id
    working = working.filter((place) => place.id !== worstId)
  }

  return { refusal: 'budget-too-small' }
}

/**
 * Uma mensagem por recusa, e nunca a mesma para duas.
 *
 * Dizer "aumente o raio" quando o problema é tempo mandaria o usuário para o
 * lado errado — e devolver "nenhum resultado" seco devolveria a ele um trabalho
 * que a máquina já fez.
 */
export const ITINERARY_REFUSAL_MESSAGES: Record<ItineraryRefusal, string> = {
  'no-candidates':
    'Nenhum lugar se encaixa nesses filtros. Amplie o raio ou tire uma categoria.',
  'budget-too-small':
    'Nada cabe nesse tempo. O problema é o relógio, não a distância — escolha mais horas.',
  'anchor-does-not-fit':
    'Esse destino sozinho já passa do tempo que você tem. Escolha mais horas ou outro destino.',
}
