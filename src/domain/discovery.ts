import { haversineKm, type Coordinates } from './geo'
import type { ExplorePlace, PlaceCategory } from './place'

/**
 * Velocidade média realista para estrada catarinense de serra e litoral,
 * já descontando trechos urbanos e curvas. Não é velocidade de cruzeiro.
 */
export const AVERAGE_SPEED_KMH = 55

/**
 * Estrada real é mais longa que a linha reta. 1,35 é um fator conservador
 * para a região; em serra o valor real é maior, e é por isso que este número
 * existe nomeado e num lugar só, pronto para ser calibrado com dados reais.
 */
export const ROAD_SINUOSITY_FACTOR = 1.35

/**
 * Fração do tempo disponível efetivamente gasta pilotando.
 *
 * Quatro horas disponíveis não significam quatro horas na sela: há parada para
 * foto, café, combustível e o tempo no próprio destino. Sem isto, a descoberta
 * sugeriria viagens que consomem o dia inteiro e voltam no escuro.
 */
export const RIDING_TIME_RATIO = 0.75

export type TimeBudget = '2h' | '4h' | '6h' | 'dia-inteiro'

export const TIME_BUDGET_MINUTES: Record<TimeBudget, number> = {
  '2h': 120,
  '4h': 240,
  '6h': 360,
  'dia-inteiro': 600,
}

export const TIME_BUDGET_LABELS: Record<TimeBudget, string> = {
  '2h': '2 horas',
  '4h': '4 horas',
  '6h': '6 horas',
  'dia-inteiro': 'Dia inteiro',
}

export interface DiscoveryQuery {
  origin: Coordinates
  timeBudget: TimeBudget
  /** Limite de distância rodoviária estimada, só de ida. */
  maxDistanceKm: number
  /** Vazio significa qualquer categoria. */
  categories: PlaceCategory[]
  onlyUnvisited: boolean
  onlyFavorites: boolean
}

export interface DiscoveryResult {
  place: ExplorePlace
  straightLineKm: number
  estimatedRoadKm: number
  /** Ida e volta, sem contar o tempo parado no destino. */
  estimatedRoundTripMinutes: number
}

/**
 * Algoritmo v1, deliberadamente simples e explicável.
 *
 * Sem IA, sem roteamento real, sem serviço externo: filtra por interesse,
 * estima distância e tempo, descarta o que não cabe e ordena.
 *
 * A ordenação é do mais distante ao mais próximo entre os que cabem. A razão é
 * de produto: quem tem seis horas e pergunta para onde ir não quer o café da
 * esquina — quer o destino mais interessante que ainda cabe no dia.
 */
export function findDestinations(
  places: readonly ExplorePlace[],
  query: DiscoveryQuery,
): DiscoveryResult[] {
  const ridingBudgetMinutes =
    TIME_BUDGET_MINUTES[query.timeBudget] * RIDING_TIME_RATIO

  const results: DiscoveryResult[] = []

  for (const place of places) {
    if (
      query.categories.length > 0 &&
      !query.categories.includes(place.category)
    ) {
      continue
    }

    if (query.onlyUnvisited && place.visitStatus === 'visitado') continue
    if (query.onlyFavorites && !place.isFavorite) continue

    const straightLineKm = haversineKm(query.origin, place)
    const estimatedRoadKm = straightLineKm * ROAD_SINUOSITY_FACTOR

    if (estimatedRoadKm > query.maxDistanceKm) continue

    const estimatedRoundTripMinutes =
      ((estimatedRoadKm * 2) / AVERAGE_SPEED_KMH) * 60

    if (estimatedRoundTripMinutes > ridingBudgetMinutes) continue

    results.push({
      place,
      straightLineKm,
      estimatedRoadKm,
      estimatedRoundTripMinutes,
    })
  }

  return results.sort((a, b) => b.estimatedRoadKm - a.estimatedRoadKm)
}
