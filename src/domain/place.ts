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

/** Uma passagem registrada por um lugar. */
export interface PlaceVisit {
  id: string
  /** Data civil, `YYYY-MM-DD`. Sem hora: a memória é do dia, não do instante. */
  visitedAt: string
  notes: string | null
  rating: number | null
}

/** Campos que o usuário informa ao criar ou editar um lugar. */
export interface NewPlace {
  name: string
  description: string
  latitude: number
  longitude: number
  municipality: string
  category: PlaceCategory
  tags: string[]
}

export type PlaceValidationError =
  | 'name-required'
  | 'name-too-long'
  | 'latitude-out-of-range'
  | 'longitude-out-of-range'
  | 'invalid-category'

export const PLACE_VALIDATION_MESSAGES: Record<PlaceValidationError, string> = {
  'name-required': 'Dê um nome ao lugar.',
  'name-too-long': 'O nome passa de 120 caracteres.',
  'latitude-out-of-range': 'A latitude está fora da faixa de -90 a 90.',
  'longitude-out-of-range': 'A longitude está fora da faixa de -180 a 180.',
  'invalid-category': 'Escolha uma categoria da lista.',
}

const MAX_NAME_LENGTH = 120

/**
 * Erros de um lugar informado pelo usuário. Lista vazia significa válido.
 *
 * Acumula em vez de parar no primeiro: corrigir um campo por vez, com uma ida ao
 * servidor entre cada, é o tipo de formulário que este produto não quer ser.
 *
 * As faixas de coordenada espelham de propósito as constraints
 * `places_latitude_range` e `places_longitude_range` da migration 0001 — o banco
 * continua sendo a autoridade, e isto existe para que a recusa chegue em PT-BR
 * antes da ida ao servidor.
 */
export function validateNewPlace(input: NewPlace): PlaceValidationError[] {
  const errors: PlaceValidationError[] = []

  const name = input.name.trim()
  if (name.length === 0) errors.push('name-required')
  else if (name.length > MAX_NAME_LENGTH) errors.push('name-too-long')

  if (!Number.isFinite(input.latitude) || Math.abs(input.latitude) > 90) {
    errors.push('latitude-out-of-range')
  }
  if (!Number.isFinite(input.longitude) || Math.abs(input.longitude) > 180) {
    errors.push('longitude-out-of-range')
  }
  if (!PLACE_CATEGORIES.includes(input.category)) {
    errors.push('invalid-category')
  }

  return errors
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
  /**
   * Cache derivado de `trip_photos`. Ao contrário de `lastVisitedAt` e
   * `visitCount`, nenhum trigger o mantém ainda: é contrato para uma iteração
   * futura e não deve ser lido como garantidamente sincronizado
   * (ver `docs/DATA-MODEL.md`).
   */
  photoCount: number
}

/**
 * Const em tempo de execução, e não só união de tipos, porque quem lê filtro da
 * URL precisa validar contra a lista real — como `PLACE_CATEGORIES`.
 */
export const VISIT_STATUSES = [
  'nao-visitado',
  'quero-conhecer',
  'visitado',
] as const

export type VisitStatus = (typeof VISIT_STATUSES)[number]

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
  /**
   * Histórico completo, do mais recente ao mais antigo.
   *
   * Vive no modelo de lista, e não numa busca separada quando o painel abre,
   * porque o produto é pessoal: dezenas de lugares, poucas visitas cada. O embed
   * custa quase nada; uma busca sob demanda custaria um mecanismo de fetch no
   * cliente que não compra nada hoje.
   *
   * Gatilho para reconsiderar, no espírito do ADR 0004: catálogo passando de
   * alguns milhares de lugares, ou histórico de um lugar passando de algumas
   * dezenas de visitas.
   */
  visits: PlaceVisit[]
  /** Lugar criado por este usuário — o único que ele pode editar ou apagar. */
  isOwn: boolean
}

export function toExplorePlace(
  place: Place,
  userState: PlaceUserState,
  visits: PlaceVisit[] = [],
  isOwn = false,
): ExplorePlace {
  return {
    ...place,
    visitStatus: deriveVisitStatus(userState),
    isFavorite: userState.isFavorite,
    photoCount: userState.photoCount,
    lastVisitedAt: userState.lastVisitedAt,
    visits,
    isOwn,
  }
}
