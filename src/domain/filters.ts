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
}

export const DEFAULT_EXPLORE_FILTERS: ExploreFilters = {
  categories: [],
  radiusKm: null,
  visitStatus: [],
  favoritesOnly: false,
}

/** Critérios que o usuário pode relaxar quando o recorte esvazia. */
export type FilterCriterion =
  | 'categories'
  | 'radiusKm'
  | 'visitStatus'
  | 'favoritesOnly'

/** Rótulos em PT-BR, como `CATEGORY_LABELS`: o código fala inglês, a interface não. */
export const FILTER_CRITERION_LABELS: Record<FilterCriterion, string> = {
  categories: 'categoria',
  radiusKm: 'raio',
  visitStatus: 'situação',
  favoritesOnly: 'favoritos',
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

    return true
  })
}
