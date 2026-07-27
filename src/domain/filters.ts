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
