import { describe, expect, it } from 'vitest'
import { deriveVisitStatus, toExplorePlace } from './place'
import type { Place, PlaceUserState } from './place'

const PLACE: Place = {
  id: 'p1',
  slug: 'serra-do-rio-do-rastro',
  name: 'Serra do Rio do Rastro',
  description: 'Descida em curvas fechadas sobre o paredão.',
  latitude: -28.39,
  longitude: -49.54,
  municipality: 'Bom Jardim da Serra',
  stateCode: 'SC',
  category: 'serra',
  tags: ['curvas', 'mirante'],
  coverImageUrl: null,
  source: 'mock',
}

function userState(overrides: Partial<PlaceUserState> = {}): PlaceUserState {
  return {
    placeId: 'p1',
    isFavorite: false,
    wantsToVisit: false,
    personalNotes: null,
    rating: null,
    lastVisitedAt: null,
    visitCount: 0,
    photoCount: 0,
    ...overrides,
  }
}

describe('deriveVisitStatus', () => {
  it('é não visitado sem visitas e sem interesse', () => {
    expect(deriveVisitStatus(userState())).toBe('nao-visitado')
  })

  it('é quero conhecer quando marcado e ainda não visitado', () => {
    expect(deriveVisitStatus(userState({ wantsToVisit: true }))).toBe(
      'quero-conhecer',
    )
  })

  it('visita vence interesse: já fui, então está visitado', () => {
    const state = userState({ wantsToVisit: true, visitCount: 2 })
    expect(deriveVisitStatus(state)).toBe('visitado')
  })
})

describe('toExplorePlace', () => {
  it('achata lugar e estado pessoal em um único modelo de leitura', () => {
    const result = toExplorePlace(
      PLACE,
      userState({ isFavorite: true, visitCount: 1, photoCount: 12 }),
    )

    expect(result.slug).toBe('serra-do-rio-do-rastro')
    expect(result.visitStatus).toBe('visitado')
    expect(result.isFavorite).toBe(true)
    expect(result.photoCount).toBe(12)
  })
})
