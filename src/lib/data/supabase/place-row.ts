import {
  toExplorePlace,
  type AccessSurface,
  type ExplorePlace,
  type PlaceCategory,
  type PlaceSource,
  type PlaceUserState,
  type PlaceVisit,
} from '@/domain/place'

/**
 * Consulta única de leitura.
 *
 * Os dois embeds trazem apenas as linhas deste usuário — não porque a consulta
 * filtre, mas porque a RLS de `place_user_states` e `place_visits` filtra por
 * `auth.uid()`. Escopo por usuário é responsabilidade do banco. Ver ADR 0008.
 */
export const PLACE_SELECT = `
  id, slug, name, description, latitude, longitude, municipality,
  state_code, category, tags, cover_image_url, source, created_by,
  place_user_states (
    is_favorite, wants_to_visit, personal_notes, rating,
    last_visited_at, visit_count, photo_count, access_surface
  ),
  place_visits ( id, visited_at, notes, rating )
`

interface PlaceUserStateRow {
  is_favorite: boolean
  wants_to_visit: boolean
  personal_notes: string | null
  rating: number | null
  last_visited_at: string | null
  visit_count: number
  photo_count: number
  access_surface: AccessSurface | null
}

interface PlaceVisitRow {
  id: string
  visited_at: string
  notes: string | null
  rating: number | null
}

export interface PlaceRow {
  id: string
  slug: string
  name: string
  description: string | null
  latitude: number
  longitude: number
  municipality: string | null
  state_code: string
  category: PlaceCategory
  tags: string[]
  cover_image_url: string | null
  source: PlaceSource
  created_by: string | null
  /**
   * Zero ou uma linha. A chave primária de `place_user_states` é
   * `(user_id, place_id)` e a RLS limita a um usuário, mas o PostgREST devolve
   * embed de um-para-muitos sempre como lista.
   */
  place_user_states: PlaceUserStateRow[]
  place_visits: PlaceVisitRow[]
}

function neutralState(placeId: string): PlaceUserState {
  return {
    placeId,
    isFavorite: false,
    wantsToVisit: false,
    personalNotes: null,
    rating: null,
    lastVisitedAt: null,
    visitCount: 0,
    photoCount: 0,
    accessSurface: null,
  }
}

function toUserState(row: PlaceRow): PlaceUserState {
  const state = row.place_user_states[0]
  if (!state) return neutralState(row.id)
  return {
    placeId: row.id,
    isFavorite: state.is_favorite,
    wantsToVisit: state.wants_to_visit,
    personalNotes: state.personal_notes,
    rating: state.rating,
    lastVisitedAt: state.last_visited_at,
    visitCount: state.visit_count,
    photoCount: state.photo_count,
    accessSurface: state.access_surface,
  }
}

function toVisits(row: PlaceRow): PlaceVisit[] {
  return row.place_visits
    .map((visit) => ({
      id: visit.id,
      visitedAt: visit.visited_at,
      notes: visit.notes,
      rating: visit.rating,
    }))
    // Data ISO ordena lexicograficamente, então não é preciso construir `Date`.
    .sort((a, b) => b.visitedAt.localeCompare(a.visitedAt))
}

/**
 * Linha do banco para o modelo de leitura. Função pura de propósito: é a parte
 * do adapter que carrega decisões e vale testar. O adapter fica só com a rede.
 */
export function toExplorePlaceFromRow(
  row: PlaceRow,
  userId: string,
): ExplorePlace {
  return toExplorePlace(
    {
      id: row.id,
      slug: row.slug,
      name: row.name,
      description: row.description ?? '',
      latitude: row.latitude,
      longitude: row.longitude,
      municipality: row.municipality ?? '',
      stateCode: row.state_code,
      category: row.category,
      tags: row.tags,
      coverImageUrl: row.cover_image_url,
      source: row.source,
    },
    toUserState(row),
    toVisits(row),
    row.created_by !== null && row.created_by === userId,
  )
}
