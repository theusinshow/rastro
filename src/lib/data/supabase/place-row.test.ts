import { describe, expect, it } from 'vitest'
import { toExplorePlaceFromRow, type PlaceRow } from './place-row'

const USER = 'u-1'

function row(overrides: Partial<PlaceRow> = {}): PlaceRow {
  return {
    id: 'p-1',
    slug: 'morro-da-igreja',
    name: 'Morro da Igreja',
    description: 'Ponto habitado mais alto do sul do país.',
    latitude: -28.1247,
    longitude: -49.4736,
    municipality: 'Urubici',
    state_code: 'SC',
    category: 'mirante',
    tags: ['altitude'],
    cover_image_url: null,
    source: 'mock',
    created_by: null,
    place_user_states: [],
    place_visits: [],
    ...overrides,
  }
}

describe('toExplorePlaceFromRow', () => {
  it('converte um lugar sem estado pessoal para o neutro', () => {
    const place = toExplorePlaceFromRow(row(), USER)
    expect(place.visitStatus).toBe('nao-visitado')
    expect(place.isFavorite).toBe(false)
    expect(place.visits).toEqual([])
    expect(place.isOwn).toBe(false)
  })

  // `description` e `municipality` são nulos no banco e string no domínio.
  // Sem esta conversão o painel imprimiria "null" na tela.
  it('converte nulos de texto em string vazia', () => {
    const place = toExplorePlaceFromRow(
      row({ description: null, municipality: null }),
      USER,
    )
    expect(place.description).toBe('')
    expect(place.municipality).toBe('')
  })

  it('lê o estado pessoal quando ele existe', () => {
    const place = toExplorePlaceFromRow(
      row({
        place_user_states: [
          {
            is_favorite: true,
            wants_to_visit: true,
            personal_notes: null,
            rating: null,
            last_visited_at: null,
            visit_count: 0,
            photo_count: 0,
            access_surface: 'misto',
          },
        ],
      }),
      USER,
    )
    expect(place.isFavorite).toBe(true)
    expect(place.visitStatus).toBe('quero-conhecer')
    expect(place.accessSurface).toBe('misto')
  })

  // Sem linha de estado, o piso é "não sei" — nunca asfalto por omissão.
  it('sem estado pessoal, o piso fica em branco', () => {
    const place = toExplorePlaceFromRow(row({ place_user_states: [] }), USER)

    expect(place.accessSurface).toBeNull()
  })

  it('ordena as visitas da mais recente para a mais antiga', () => {
    const place = toExplorePlaceFromRow(
      row({
        place_user_states: [
          {
            is_favorite: false,
            wants_to_visit: false,
            personal_notes: null,
            rating: null,
            last_visited_at: '2026-07-27',
            visit_count: 2,
            photo_count: 0,
            access_surface: null,
          },
        ],
        place_visits: [
          { id: 'v-1', visited_at: '2025-03-14', notes: null, rating: null },
          { id: 'v-2', visited_at: '2026-07-27', notes: 'chuva', rating: 5 },
        ],
      }),
      USER,
    )
    expect(place.visits.map((visit) => visit.visitedAt)).toEqual([
      '2026-07-27',
      '2025-03-14',
    ])
    expect(place.visitStatus).toBe('visitado')
  })

  it('marca como próprio o lugar criado por este usuário', () => {
    expect(toExplorePlaceFromRow(row({ created_by: USER }), USER).isOwn).toBe(true)
    expect(toExplorePlaceFromRow(row({ created_by: 'outro' }), USER).isOwn).toBe(
      false,
    )
  })
})
