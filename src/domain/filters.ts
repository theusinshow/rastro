import { haversineKm, type Coordinates } from './geo'
import type { ExplorePlace, PlaceCategory, VisitStatus } from './place'

/** Opções de raio oferecidas na interface, em quilômetros. */
export const RADIUS_OPTIONS_KM = [50, 100, 150, 300] as const

/**
 * Filtros do Explore.
 *
 * Listas vazias significam "sem restrição", não "nenhum resultado". É a
 * interpretação que casa com a interface: nada selecionado = mostrar tudo.
 */
export interface ExploreFilters {
  categories: PlaceCategory[]
  /** Linha reta a partir da origem. `null` = sem limite. */
  radiusKm: number | null
  visitStatus: VisitStatus[]
  favoritesOnly: boolean
  /** Texto livre. Vazio = sem restrição. */
  search: string
}

export const DEFAULT_EXPLORE_FILTERS: ExploreFilters = {
  categories: [],
  radiusKm: null,
  visitStatus: [],
  favoritesOnly: false,
  search: '',
}

/**
 * Minúsculas e **sem acento**.
 *
 * Sem isso, procurar "conceicao" não acha "Lagoa da Conceição" e "embau" não acha
 * "Guarda do Embaú — e ninguém digita acento com luva, parado no acostamento.
 * `NFD` separa a letra do sinal, e a faixa `̀-ͯ` remove só os sinais.
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Casa contra nome, município e etiquetas.
 *
 * As etiquetas entram porque é assim que se procura o que se quer sem lembrar o
 * nome: "curvas", "cachoeira", "mirante".
 */
export function matchesSearch(place: ExplorePlace, term: string): boolean {
  const alvo = normalizeForSearch(term)
  if (alvo.length === 0) return true

  const campos = [place.name, place.municipality, ...place.tags]
  return campos.some((campo) => normalizeForSearch(campo).includes(alvo))
}

/** Rótulos de situação, no vocabulário da interface. */
const VISIT_STATUS_LABELS: Record<VisitStatus, string> = {
  'nao-visitado': 'Não visitados',
  'quero-conhecer': 'Quero conhecer',
  visitado: 'Já visitados',
}

/**
 * Quantos critérios estão restringindo o recorte.
 *
 * Conta critérios, não valores: três categorias marcadas são **uma** restrição
 * de categoria. É o número que a trilha mostra no botão "Filtrar", e por isso
 * conta só o que mora **dentro** daquele painel: a busca fica de fora porque tem
 * campo próprio e visível. Um "1" no botão sem nada marcado ao abri-lo seria uma
 * mentira.
 */
export function countActiveCriteria(filters: ExploreFilters): number {
  let total = 0
  if (filters.categories.length > 0) total += 1
  if (filters.radiusKm !== null) total += 1
  if (filters.visitStatus.length > 0) total += 1
  if (filters.favoritesOnly) total += 1
  return total
}

/**
 * O recorte atual em palavras, para ser lido sem abrir os filtros.
 *
 * Vive no domínio porque é tradução de estado para linguagem, não desenho — e
 * porque a ordem importa: categoria, distância, situação, favoritos é a ordem em
 * que a pessoa pensa a viagem.
 *
 * A busca não entra: ela já está escrita, por extenso, no campo logo acima deste
 * resumo. Repeti-la aqui seria descrever o que está à vista.
 */
export function describeFilters(
  filters: ExploreFilters,
  categoryLabels: Record<PlaceCategory, string>,
): string[] {
  const partes: string[] = []

  for (const category of filters.categories) {
    partes.push(categoryLabels[category])
  }
  if (filters.radiusKm !== null) {
    partes.push(`até ${filters.radiusKm} km`)
  }
  for (const status of filters.visitStatus) {
    partes.push(VISIT_STATUS_LABELS[status])
  }
  if (filters.favoritesOnly) {
    partes.push('Favoritos')
  }

  return partes
}

/** Critérios que o usuário pode relaxar quando o recorte esvazia. */
export type FilterCriterion =
  | 'categories'
  | 'radiusKm'
  | 'visitStatus'
  | 'favoritesOnly'
  | 'search'

/** Rótulos em PT-BR, como `CATEGORY_LABELS`: o código fala inglês, a interface não. */
export const FILTER_CRITERION_LABELS: Record<FilterCriterion, string> = {
  categories: 'categoria',
  radiusKm: 'raio',
  visitStatus: 'situação',
  favoritesOnly: 'favoritos',
  search: 'busca',
}

export interface FilterRelaxation {
  criterion: FilterCriterion
  /** Quantos lugares voltam ao recorte se só este critério for removido. */
  recovered: number
  /** Os mesmos filtros, com o critério em questão zerado. */
  filters: ExploreFilters
}

/**
 * Critério que sozinho está eliminando mais lugares do recorte.
 *
 * Existe para que a interface possa oferecer uma saída de um clique quando o
 * mapa esvazia, em vez de descrever em prosa um trabalho que o sistema já fez.
 * `null` quando nenhum critério isolado devolveria algo — aí a única saída é
 * limpar tudo.
 */
export function mostRestrictiveCriterion(
  places: readonly ExplorePlace[],
  filters: ExploreFilters,
  origin: Coordinates,
): FilterRelaxation | null {
  const candidates: Array<{ criterion: FilterCriterion; filters: ExploreFilters }> =
    []

  if (filters.categories.length > 0) {
    candidates.push({
      criterion: 'categories',
      filters: { ...filters, categories: [] },
    })
  }
  if (filters.radiusKm !== null) {
    candidates.push({ criterion: 'radiusKm', filters: { ...filters, radiusKm: null } })
  }
  if (filters.visitStatus.length > 0) {
    candidates.push({
      criterion: 'visitStatus',
      filters: { ...filters, visitStatus: [] },
    })
  }
  if (filters.favoritesOnly) {
    candidates.push({
      criterion: 'favoritesOnly',
      filters: { ...filters, favoritesOnly: false },
    })
  }
  if (filters.search.trim().length > 0) {
    candidates.push({ criterion: 'search', filters: { ...filters, search: '' } })
  }

  let best: FilterRelaxation | null = null

  for (const candidate of candidates) {
    const recovered = filterPlaces(places, candidate.filters, origin).length
    if (recovered > 0 && (best === null || recovered > best.recovered)) {
      best = { ...candidate, recovered }
    }
  }

  return best
}

/** Todos os critérios são combinados com E. Retorna um novo array. */
export function filterPlaces(
  places: readonly ExplorePlace[],
  filters: ExploreFilters,
  origin: Coordinates,
): ExplorePlace[] {
  return places.filter((place) => {
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(place.category)
    ) {
      return false
    }

    if (
      filters.visitStatus.length > 0 &&
      !filters.visitStatus.includes(place.visitStatus)
    ) {
      return false
    }

    if (filters.favoritesOnly && !place.isFavorite) {
      return false
    }

    if (filters.radiusKm !== null && haversineKm(origin, place) > filters.radiusKm) {
      return false
    }

    if (!matchesSearch(place, filters.search)) {
      return false
    }

    return true
  })
}
