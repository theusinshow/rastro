import { RADIUS_OPTIONS_KM } from './filters'
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

/**
 * Tempo parado por parada: foto, café, esticar as pernas, combustível.
 *
 * Existe porque o `RIDING_TIME_RATIO` acima NÃO generaliza. Ele foi calibrado
 * para um destino, reservando 25% do tempo para tudo o que não é pilotar — e
 * cinco paradas não custam a mesma proporção que uma. Para um destino em quatro
 * horas o ratio reserva 60 minutos; este modelo reserva 30.
 *
 * A divergência é consciente: mudar o `/descobrir` alteraria comportamento já
 * calibrado sem dado que justifique. O gatilho para unificar as duas réguas é
 * o registro de viagens passar a gravar distância medida — então dá para
 * calibrar com dado em vez de palpite.
 */
export const MINUTES_PER_STOP = 30

/**
 * Distância rodoviária estimada a partir da linha reta.
 *
 * Existe como função, e não como multiplicação repetida em cada chamador, para
 * que a lista do recorte, o painel do lugar e a descoberta não possam divergir
 * sobre quantos quilômetros tem o mesmo destino.
 */
export function estimateRoadKm(straightLineKm: number): number {
  return straightLineKm * ROAD_SINUOSITY_FACTOR
}

/**
 * Tempo de pilotagem, em minutos, para uma distância rodoviária estimada.
 *
 * Recebe quilômetros de estrada — nunca linha reta. Para ida e volta, passe o
 * dobro da distância.
 */
export function estimateRidingMinutes(roadKm: number): number {
  return (roadKm / AVERAGE_SPEED_KMH) * 60
}

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
    const estimatedRoadKm = estimateRoadKm(straightLineKm)

    if (estimatedRoadKm > query.maxDistanceKm) continue

    const estimatedRoundTripMinutes = estimateRidingMinutes(estimatedRoadKm * 2)

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

/** O que precisaria mudar na consulta para que ela devolvesse algo. */
export type DiscoveryRelaxation =
  | 'maxDistanceKm'
  | 'timeBudget'
  | 'categories'
  | 'onlyUnvisited'
  | 'onlyFavorites'

export interface DiscoverySuggestion {
  relaxation: DiscoveryRelaxation
  /** A mesma consulta com um único limite ampliado. */
  query: DiscoveryQuery
  /** Quantos destinos essa consulta devolveria. */
  count: number
}

const TIME_BUDGETS_ASCENDING: TimeBudget[] = ['2h', '4h', '6h', 'dia-inteiro']

/**
 * A menor ampliação de limite que faria a busca devolver algo. `null` quando
 * nem remover todos os limites produz destino.
 *
 * O sistema sabe qual restrição eliminou o quê, porque foi ele que filtrou.
 * Devolver isso como prosa ("aumente a distância, o tempo, ou remova alguma
 * categoria") transfere ao usuário um trabalho que a máquina já fez.
 *
 * A ordem das tentativas é de produto: ampliar a distância muda menos a viagem
 * do que gastar o dia inteiro, e ambas mudam menos do que desistir do tipo de
 * lugar que se queria ver.
 */
export function suggestBroaderQuery(
  places: readonly ExplorePlace[],
  query: DiscoveryQuery,
): DiscoverySuggestion | null {
  const attempts: Array<{ relaxation: DiscoveryRelaxation; query: DiscoveryQuery }> =
    []

  for (const radius of RADIUS_OPTIONS_KM) {
    if (radius > query.maxDistanceKm) {
      attempts.push({
        relaxation: 'maxDistanceKm',
        query: { ...query, maxDistanceKm: radius },
      })
    }
  }

  const currentBudget = TIME_BUDGETS_ASCENDING.indexOf(query.timeBudget)
  for (const budget of TIME_BUDGETS_ASCENDING.slice(currentBudget + 1)) {
    attempts.push({ relaxation: 'timeBudget', query: { ...query, timeBudget: budget } })
  }

  if (query.categories.length > 0) {
    attempts.push({ relaxation: 'categories', query: { ...query, categories: [] } })
  }

  /*
   * Os dois alternadores também entram, e faltavam.
   *
   * Sem eles, quando nenhuma outra folga resolvia, a interface caía num texto
   * fixo mandando "remover o filtro de favoritos ou o de não visitados" — mesmo
   * quando nenhum dos dois estava ligado. Conselho impossível de seguir. Agora,
   * se desligá-los resolve, isso vira um botão que resolve; e se não resolve,
   * nada é sugerido, e quem chama sabe que a causa é outra. Ver RASTRO-007.
   */
  if (query.onlyUnvisited) {
    attempts.push({
      relaxation: 'onlyUnvisited',
      query: { ...query, onlyUnvisited: false },
    })
  }

  if (query.onlyFavorites) {
    attempts.push({
      relaxation: 'onlyFavorites',
      query: { ...query, onlyFavorites: false },
    })
  }

  for (const attempt of attempts) {
    const count = findDestinations(places, attempt.query).length
    if (count > 0) return { ...attempt, count }
  }

  return null
}

/**
 * Distância de estrada estimada até o lugar mais próximo do catálogo,
 * ignorando **todo** filtro.
 *
 * Existe para separar dois vazios que a interface tratava como um só: "seus
 * filtros estão apertados demais" e "não há nada perto de você". O segundo é o
 * caso de quem abre o Rastro fora de Santa Catarina, e a resposta honesta não é
 * mandar mexer em filtro — é dizer a que distância está o lugar mais próximo.
 *
 * `null` quando o catálogo está vazio.
 */
export function nearestPlaceKm(
  places: readonly ExplorePlace[],
  origin: Coordinates,
): number | null {
  let nearest: number | null = null

  for (const place of places) {
    const km = estimateRoadKm(haversineKm(origin, place))
    if (nearest === null || km < nearest) nearest = km
  }

  return nearest
}
