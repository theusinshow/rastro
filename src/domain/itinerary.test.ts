import { describe, expect, it } from 'vitest'
import {
  SCORE_STALENESS_MAX,
  SCORE_UNVISITED,
  SCORE_VISITED,
  SCORE_WANTS_TO_VISIT,
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
