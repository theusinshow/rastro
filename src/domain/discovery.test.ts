import { describe, expect, it } from 'vitest'
import {
  AVERAGE_SPEED_KMH,
  ROAD_SINUOSITY_FACTOR,
  estimateRidingMinutes,
  estimateRoadKm,
  findDestinations,
  suggestBroaderQuery,
} from './discovery'
import type { DiscoveryQuery } from './discovery'
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
    visits: [],
    isOwn: false,
    accessSurface: null,
    photoCount: 0,
    lastVisitedAt: null,
    ...overrides,
  }
}

function query(overrides: Partial<DiscoveryQuery> = {}): DiscoveryQuery {
  return {
    origin: ORIGIN,
    timeBudget: 'dia-inteiro',
    maxDistanceKm: 300,
    categories: [],
    onlyUnvisited: false,
    onlyFavorites: false,
    ...overrides,
  }
}

describe('estimateRoadKm', () => {
  it('aplica o fator de sinuosidade sobre a linha reta', () => {
    expect(estimateRoadKm(100)).toBeCloseTo(100 * ROAD_SINUOSITY_FACTOR, 10)
  })

  it('sempre estima estrada maior que a linha reta', () => {
    expect(estimateRoadKm(132)).toBeGreaterThan(132)
  })

  it('mantém a origem em zero', () => {
    expect(estimateRoadKm(0)).toBe(0)
  })
})

describe('estimateRidingMinutes', () => {
  it('converte quilômetros de estrada em minutos na velocidade média', () => {
    expect(estimateRidingMinutes(AVERAGE_SPEED_KMH)).toBeCloseTo(60, 10)
  })

  it('escala linearmente com a distância', () => {
    expect(estimateRidingMinutes(220)).toBeCloseTo(
      estimateRidingMinutes(110) * 2,
      10,
    )
  })

  it('não gasta tempo para distância nenhuma', () => {
    expect(estimateRidingMinutes(0)).toBe(0)
  })
})

describe('findDestinations', () => {
  it('usa os mesmos estimadores expostos ao restante do produto', () => {
    const destino = place({ id: 'd', latitude: -28.02, longitude: -49.0 })
    const [result] = findDestinations([destino], query())

    expect(result).toBeDefined()
    expect(result!.estimatedRoadKm).toBe(estimateRoadKm(result!.straightLineKm))
    expect(result!.estimatedRoundTripMinutes).toBe(
      estimateRidingMinutes(result!.estimatedRoadKm * 2),
    )
  })

  it('descarta o que passa do limite de distância rodoviária', () => {
    const perto = place({ id: 'perto', latitude: -27.7, longitude: -48.7 })
    const longe = place({ id: 'longe', latitude: -28.39, longitude: -49.54 })
    const result = findDestinations([perto, longe], query({ maxDistanceKm: 50 }))
    expect(result.map((r) => r.place.id)).toEqual(['perto'])
  })

  it('descarta o que não cabe no tempo disponível, considerando a volta', () => {
    const distante = place({ id: 'distante', latitude: -28.39, longitude: -49.54 })
    const result = findDestinations(
      [distante],
      query({ timeBudget: '2h', maxDistanceKm: 300 }),
    )
    expect(result).toHaveLength(0)
  })

  it('ordena do mais distante ao mais próximo entre os que cabem', () => {
    const a = place({ id: 'a', latitude: -27.7, longitude: -48.7 })
    const b = place({ id: 'b', latitude: -28.02, longitude: -49.0 })
    const result = findDestinations([a, b], query())
    expect(result.map((r) => r.place.id)).toEqual(['b', 'a'])
  })

  it('respeita somente não visitados', () => {
    const places = [
      place({ id: 'a', visitStatus: 'visitado' }),
      place({ id: 'b', visitStatus: 'nao-visitado' }),
      place({ id: 'c', visitStatus: 'quero-conhecer' }),
    ]
    const result = findDestinations([...places], query({ onlyUnvisited: true }))
    expect(result.map((r) => r.place.id).sort()).toEqual(['b', 'c'])
  })

  it('respeita somente favoritos', () => {
    const places = [
      place({ id: 'a', isFavorite: true }),
      place({ id: 'b', isFavorite: false }),
    ]
    const result = findDestinations(places, query({ onlyFavorites: true }))
    expect(result.map((r) => r.place.id)).toEqual(['a'])
  })

  it('estima estrada maior que a linha reta', () => {
    const destino = place({ id: 'd', latitude: -28.02, longitude: -49.0 })
    const [result] = findDestinations([destino], query())
    expect(result).toBeDefined()
    expect(result!.estimatedRoadKm).toBeGreaterThan(result!.straightLineKm)
  })

  it('devolve lista vazia sem lugares', () => {
    expect(findDestinations([], query())).toEqual([])
  })
})

describe('suggestBroaderQuery', () => {
  // ~130 km em linha reta a partir da origem, ~176 km de estrada estimada.
  const distante = place({ id: 'distante', latitude: -28.39, longitude: -49.54 })

  it('sugere o menor raio que devolve destino', () => {
    const suggestion = suggestBroaderQuery(
      [distante],
      query({ maxDistanceKm: 50, timeBudget: 'dia-inteiro' }),
    )

    expect(suggestion?.relaxation).toBe('maxDistanceKm')
    expect(suggestion?.query.maxDistanceKm).toBe(300)
    expect(suggestion?.count).toBe(1)
  })

  it('recorre ao tempo quando a distância já está no máximo', () => {
    const suggestion = suggestBroaderQuery(
      [distante],
      query({ maxDistanceKm: 300, timeBudget: '2h' }),
    )

    expect(suggestion?.relaxation).toBe('timeBudget')
    expect(suggestion?.query.timeBudget).toBe('dia-inteiro')
  })

  it('só abre mão da categoria depois de distância e tempo', () => {
    const suggestion = suggestBroaderQuery(
      [distante],
      query({ categories: ['praia'] }),
    )

    expect(suggestion?.relaxation).toBe('categories')
    expect(suggestion?.query.categories).toEqual([])
  })

  it('devolve null quando nenhuma ampliação de limite resolve', () => {
    expect(
      suggestBroaderQuery([distante], query({ onlyFavorites: true })),
    ).toBeNull()
  })
})
