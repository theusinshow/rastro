export const PLACE_CATEGORIES = [
  'serra',
  'praia',
  'mirante',
  'natureza',
  'cachoeira',
  'estrada',
  'cidade',
  'cafe',
  'restaurante',
  'ponto_turistico',
] as const

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number]

/** Rótulos em PT-BR. O código fala inglês; a interface fala português. */
export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  serra: 'Serra',
  praia: 'Praia',
  mirante: 'Mirante',
  natureza: 'Natureza',
  cachoeira: 'Cachoeira',
  estrada: 'Estrada',
  cidade: 'Cidade',
  cafe: 'Café',
  restaurante: 'Restaurante',
  ponto_turistico: 'Ponto turístico',
}

export type PlaceSource = 'mock' | 'manual' | 'imported'

/**
 * Fato objetivo sobre um lugar. Compartilhável entre usuários.
 *
 * Nada aqui é opinião: favorito, visitado e nota pessoal vivem em
 * `PlaceUserState`. Ver ADR 0003.
 *
 * Não há campo de distância nem de tempo estimado: ambos dependem da origem de
 * quem consulta e são calculados em tempo de leitura.
 */
export interface Place {
  id: string
  slug: string
  name: string
  description: string
  latitude: number
  longitude: number
  municipality: string
  /** Unidade federativa, ex.: `'SC'`. */
  stateCode: string
  category: PlaceCategory
  tags: string[]
  coverImageUrl: string | null
  source: PlaceSource
}

/** Vínculo entre um usuário e um lugar. */
export interface PlaceUserState {
  placeId: string
  isFavorite: boolean
  wantsToVisit: boolean
  personalNotes: string | null
  /** Opinião geral e atual sobre o lugar, 1 a 5. */
  rating: number | null
  /** Cache derivado de `place_visits`, mantido por trigger no banco. */
  lastVisitedAt: string | null
  visitCount: number
  photoCount: number
}

export type VisitStatus = 'nao-visitado' | 'quero-conhecer' | 'visitado'

/**
 * Eixo primário de leitura do pin. Mutuamente exclusivo por construção.
 *
 * Ter visitado vence ter marcado interesse: se já fui, o lugar está visitado,
 * mesmo que a marcação de "quero conhecer" nunca tenha sido removida.
 */
export function deriveVisitStatus(userState: PlaceUserState): VisitStatus {
  if (userState.visitCount > 0) return 'visitado'
  if (userState.wantsToVisit) return 'quero-conhecer'
  return 'nao-visitado'
}

/**
 * Modelo de leitura consumido pelo mapa, pelos filtros e pelo painel.
 *
 * Achatar aqui, uma vez, evita que cada componente precise entender a separação
 * entre catálogo e estado pessoal.
 */
export interface ExplorePlace extends Place {
  visitStatus: VisitStatus
  isFavorite: boolean
  photoCount: number
  lastVisitedAt: string | null
}

export function toExplorePlace(
  place: Place,
  userState: PlaceUserState,
): ExplorePlace {
  return {
    ...place,
    visitStatus: deriveVisitStatus(userState),
    isFavorite: userState.isFavorite,
    photoCount: userState.photoCount,
    lastVisitedAt: userState.lastVisitedAt,
  }
}
