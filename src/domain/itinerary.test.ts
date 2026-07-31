import { describe, expect, it } from 'vitest'
import { MINUTES_PER_STOP, TIME_BUDGET_MINUTES } from './discovery'
import {
  SCORE_STALENESS_MAX,
  SCORE_UNVISITED,
  SCORE_VISITED,
  SCORE_WANTS_TO_VISIT,
  buildItinerary,
  isRefusal,
  orderAndMeasure,
  scorePlace,
} from './itinerary'
import type { ItineraryRequest } from './itinerary'
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
    accessSurface: null,
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

function request(overrides: Partial<ItineraryRequest> = {}): ItineraryRequest {
  return {
    origin: ORIGIN,
    timeBudget: 'dia-inteiro',
    maxDistanceKm: 300,
    categories: [],
    anchorPlaceId: null,
    maxStops: 4,
    ...overrides,
  }
}

describe('buildItinerary', () => {
  it('recusa com no-candidates quando nada passa pelos filtros', () => {
    const outcome = buildItinerary(
      [place({ slug: 'a', category: 'praia' })],
      request({ categories: ['cachoeira'] }),
      TODAY,
    )

    expect(isRefusal(outcome)).toBe(true)
    if (isRefusal(outcome)) expect(outcome.refusal).toBe('no-candidates')
  })

  it('recusa com budget-too-small quando passa pelo filtro mas nada cabe no tempo', () => {
    const outcome = buildItinerary(
      [place({ slug: 'longe', latitude: -26.0, longitude: -48.0 })],
      request({ timeBudget: '2h', maxDistanceKm: 1000 }),
      TODAY,
    )

    expect(isRefusal(outcome)).toBe(true)
    if (isRefusal(outcome)) expect(outcome.refusal).toBe('budget-too-small')
  })

  it('recusa com anchor-does-not-fit quando só a âncora já estoura', () => {
    const outcome = buildItinerary(
      [
        place({
          id: 'anchor',
          slug: 'anchor',
          latitude: -26.0,
          longitude: -48.0,
        }),
        place({
          id: 'perto',
          slug: 'perto',
          latitude: -27.65,
          longitude: -48.68,
        }),
      ],
      request({ timeBudget: '2h', maxDistanceKm: 1000, anchorPlaceId: 'anchor' }),
      TODAY,
    )

    expect(isRefusal(outcome)).toBe(true)
    if (isRefusal(outcome)) expect(outcome.refusal).toBe('anchor-does-not-fit')
  })

  it('nunca descarta a âncora, mesmo quando ela pontua menos', () => {
    const outcome = buildItinerary(
      [
        place({
          id: 'anchor',
          slug: 'anchor',
          visitStatus: 'visitado',
          lastVisitedAt: TODAY,
          latitude: -27.9,
          longitude: -49.0,
        }),
        place({
          id: 'q1',
          slug: 'q1',
          visitStatus: 'quero-conhecer',
          latitude: -27.7,
          longitude: -48.8,
        }),
        place({
          id: 'q2',
          slug: 'q2',
          visitStatus: 'quero-conhecer',
          latitude: -27.8,
          longitude: -48.9,
        }),
      ],
      request({ timeBudget: '4h', maxStops: 2, anchorPlaceId: 'anchor' }),
      TODAY,
    )

    expect(isRefusal(outcome)).toBe(false)
    if (!isRefusal(outcome)) {
      expect(outcome.stops.map((s) => s.id)).toContain('anchor')
    }
  })

  it('respeita maxStops', () => {
    const many = Array.from({ length: 8 }, (_, i) =>
      place({
        id: `p${i}`,
        slug: `p${i}`,
        latitude: -27.65 - i * 0.02,
        longitude: -48.68 - i * 0.02,
      }),
    )

    const outcome = buildItinerary(many, request({ maxStops: 3 }), TODAY)

    expect(isRefusal(outcome)).toBe(false)
    if (!isRefusal(outcome)) expect(outcome.stops.length).toBeLessThanOrEqual(3)
  })

  it('em empate de interesse, poda a parada mais LONGE — não a primeira da lista', () => {
    // Regressão. Candidatos sem visita e sem favorito pontuam igual, e a poda
    // desempatava em ordem de array: descartava a parada mais próxima e mantinha
    // as caras, então o roteiro encolhia sem nunca passar a caber. Um passeio
    // perfeitamente possível era recusado com budget-too-small.
    const perto = place({
      id: 'perto',
      slug: 'perto',
      latitude: -27.7,
      longitude: -48.72,
    })
    const longe = place({
      id: 'longe',
      slug: 'longe',
      latitude: -28.6,
      longitude: -49.7,
    })

    const outcome = buildItinerary(
      [perto, longe],
      request({ timeBudget: '4h', maxStops: 2 }),
      TODAY,
    )

    expect(isRefusal(outcome)).toBe(false)
    if (!isRefusal(outcome)) {
      expect(outcome.stops.map((s) => s.id)).toEqual(['perto'])
    }
  })

  it('cabe no orçamento, descontando o tempo parado em cada parada', () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      place({
        id: `p${i}`,
        slug: `p${i}`,
        latitude: -27.7 - i * 0.15,
        longitude: -48.8 - i * 0.15,
      }),
    )

    const outcome = buildItinerary(
      many,
      request({ timeBudget: '4h', maxStops: 5 }),
      TODAY,
    )

    expect(isRefusal(outcome)).toBe(false)
    if (!isRefusal(outcome)) {
      const parado = outcome.stops.length * MINUTES_PER_STOP
      expect(outcome.totalRidingMinutes).toBeLessThanOrEqual(
        TIME_BUDGET_MINUTES['4h'] - parado,
      )
    }
  })
})
