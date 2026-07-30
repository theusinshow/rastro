import { describe, expect, it } from 'vitest'
import {
  SCORE_STALENESS_MAX,
  SCORE_UNVISITED,
  SCORE_VISITED,
  SCORE_WANTS_TO_VISIT,
  orderAndMeasure,
  scorePlace,
} from './itinerary'
import type { ExplorePlace } from './place'

const TODAY = '2026-07-30'

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
    photoCount: 0,
    lastVisitedAt: null,
    ...overrides,
  }
}

describe('scorePlace', () => {
  it('põe quero-conhecer acima de não visitado, e não visitado acima de visitado', () => {
    const wanted = scorePlace(place({ visitStatus: 'quero-conhecer' }), TODAY)
    const unvisited = scorePlace(place({ visitStatus: 'nao-visitado' }), TODAY)
    const visited = scorePlace(
      place({ visitStatus: 'visitado', lastVisitedAt: TODAY }),
      TODAY,
    )

    expect(wanted).toBeGreaterThan(unvisited)
    expect(unvisited).toBeGreaterThan(visited)
  })

  it('dá bônus a favorito', () => {
    const plain = scorePlace(place({}), TODAY)
    const favorite = scorePlace(place({ isFavorite: true }), TODAY)

    expect(favorite).toBeGreaterThan(plain)
  })

  it('vale mais o lugar visitado há muito tempo que o visitado agora', () => {
    const recent = scorePlace(
      place({ visitStatus: 'visitado', lastVisitedAt: '2026-07-01' }),
      TODAY,
    )
    const old = scorePlace(
      place({ visitStatus: 'visitado', lastVisitedAt: '2020-01-01' }),
      TODAY,
    )

    expect(old).toBeGreaterThan(recent)
  })

  it('satura o bônus de recência, para lugar antigo não vencer quero-conhecer', () => {
    const ancient = scorePlace(
      place({ visitStatus: 'visitado', lastVisitedAt: '1990-01-01' }),
      TODAY,
    )

    expect(ancient).toBe(SCORE_VISITED + SCORE_STALENESS_MAX)
    expect(ancient).toBeLessThan(SCORE_WANTS_TO_VISIT)
  })

  it('não dá bônus de recência a quem nunca foi visitado', () => {
    expect(scorePlace(place({ visitStatus: 'nao-visitado' }), TODAY)).toBe(
      SCORE_UNVISITED,
    )
  })
})

const ORIGIN = { latitude: -27.6455, longitude: -48.67 }

describe('orderAndMeasure', () => {
  it('devolve roteiro vazio para nenhuma parada', () => {
    const result = orderAndMeasure(ORIGIN, [])

    expect(result.stops).toEqual([])
    expect(result.legs).toEqual([])
    expect(result.totalRoadKm).toBe(0)
  })

  it('fecha o ciclo: a última perna volta para a origem', () => {
    const result = orderAndMeasure(ORIGIN, [
      place({ slug: 'a', latitude: -28, longitude: -49 }),
    ])

    // Uma parada: origem -> a, e a -> origem.
    expect(result.legs).toHaveLength(2)
    expect(result.legs[0]?.fromStopIndex).toBe(-1)
    expect(result.legs[1]?.fromStopIndex).toBe(0)
  })

  it('ordena para não cruzar: o caminho ruim é reordenado num mais curto', () => {
    // Quatro pontos num quadrado, entregues na ordem que se cruza (A, C, B, D).
    const square = [
      place({ slug: 'a', latitude: -27.0, longitude: -49.0 }),
      place({ slug: 'c', latitude: -28.0, longitude: -48.0 }),
      place({ slug: 'b', latitude: -27.0, longitude: -48.0 }),
      place({ slug: 'd', latitude: -28.0, longitude: -49.0 }),
    ]

    const result = orderAndMeasure({ latitude: -27.5, longitude: -48.5 }, square)
    const order = result.stops.map((stop) => stop.slug).join('')

    // O perímetro do quadrado, em algum sentido — nunca a diagonal cruzada.
    expect([
      'abcd',
      'adcb',
      'bcda',
      'badc',
      'cdab',
      'cbad',
      'dabc',
      'dcba',
    ]).toContain(order)
  })

  it('soma os trechos no total', () => {
    const result = orderAndMeasure(ORIGIN, [
      place({ slug: 'a', latitude: -28, longitude: -49 }),
      place({ slug: 'b', latitude: -28.5, longitude: -49.5 }),
    ])

    const somaDosTrechos = result.legs.reduce((sum, leg) => sum + leg.roadKm, 0)
    expect(result.totalRoadKm).toBeCloseTo(somaDosTrechos, 6)
    expect(result.totalRoadKm).toBeGreaterThan(0)
  })
})
