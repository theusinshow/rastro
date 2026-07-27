import { describe, expect, it } from 'vitest'
import { DEFAULT_EXPLORE_FILTERS, filterPlaces } from './filters'
import type { ExplorePlace } from './place'

const ORIGIN = { latitude: -27.6455, longitude: -48.67 }

function place(overrides: Partial<ExplorePlace>): ExplorePlace {
  return {
    id: 'x',
    slug: 'x',
    name: 'X',
    description: '',
    latitude: -27.6455,
    longitude: -48.67,
    municipality: 'Palhoça',
    stateCode: 'SC',
    category: 'serra',
    tags: [],
    coverImageUrl: null,
    source: 'mock',
    visitStatus: 'nao-visitado',
    isFavorite: false,
    photoCount: 0,
    lastVisitedAt: null,
    ...overrides,
  }
}

describe('filterPlaces', () => {
  it('sem filtros, devolve tudo', () => {
    const places = [place({ id: 'a' }), place({ id: 'b', category: 'praia' })]
    expect(filterPlaces(places, DEFAULT_EXPLORE_FILTERS, ORIGIN)).toHaveLength(2)
  })

  it('filtra por categoria, aceitando qualquer uma das selecionadas', () => {
    const places = [
      place({ id: 'a', category: 'serra' }),
      place({ id: 'b', category: 'praia' }),
      place({ id: 'c', category: 'cafe' }),
    ]
    const result = filterPlaces(
      places,
      { ...DEFAULT_EXPLORE_FILTERS, categories: ['serra', 'praia'] },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('filtra por raio em linha reta a partir da origem', () => {
    const perto = place({ id: 'perto' })
    const longe = place({ id: 'longe', latitude: -28.39, longitude: -49.54 })
    const result = filterPlaces(
      [perto, longe],
      { ...DEFAULT_EXPLORE_FILTERS, radiusKm: 50 },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['perto'])
  })

  it('filtra por status de visita', () => {
    const places = [
      place({ id: 'a', visitStatus: 'visitado' }),
      place({ id: 'b', visitStatus: 'nao-visitado' }),
    ]
    const result = filterPlaces(
      places,
      { ...DEFAULT_EXPLORE_FILTERS, visitStatus: ['nao-visitado'] },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['b'])
  })

  it('filtra apenas favoritos quando marcado', () => {
    const places = [
      place({ id: 'a', isFavorite: true }),
      place({ id: 'b', isFavorite: false }),
    ]
    const result = filterPlaces(
      places,
      { ...DEFAULT_EXPLORE_FILTERS, favoritesOnly: true },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['a'])
  })

  it('combina filtros com E, não com OU', () => {
    const places = [
      place({ id: 'a', category: 'serra', isFavorite: true }),
      place({ id: 'b', category: 'serra', isFavorite: false }),
      place({ id: 'c', category: 'praia', isFavorite: true }),
    ]
    const result = filterPlaces(
      places,
      { ...DEFAULT_EXPLORE_FILTERS, categories: ['serra'], favoritesOnly: true },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['a'])
  })

  it('não muta o array recebido', () => {
    const places = [place({ id: 'a' })]
    filterPlaces(places, { ...DEFAULT_EXPLORE_FILTERS, radiusKm: 1 }, ORIGIN)
    expect(places).toHaveLength(1)
  })
})
