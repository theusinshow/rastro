import { describe, expect, it } from 'vitest'
import {
  PLACE_VALIDATION_MESSAGES,
  deriveVisitStatus,
  toExplorePlace,
  validateNewPlace,
} from './place'
import type { NewPlace, Place, PlaceUserState } from './place'

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
    accessSurface: null,
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

  it('assume sem visitas e não próprio quando os argumentos são omitidos', () => {
    const result = toExplorePlace(PLACE, userState())
    expect(result.visits).toEqual([])
    expect(result.isOwn).toBe(false)
  })

  it('carrega as visitas e a propriedade quando informadas', () => {
    const visits = [
      { id: 'v1', visitedAt: '2026-07-27', notes: null, rating: null },
    ]
    const result = toExplorePlace(PLACE, userState({ visitCount: 1 }), visits, true)

    expect(result.visits).toEqual(visits)
    expect(result.isOwn).toBe(true)
    expect(result.visitStatus).toBe('visitado')
  })
})

const VALID_NEW_PLACE: NewPlace = {
  name: 'Mirante da Serra',
  description: 'Vista do vale.',
  latitude: -28.1,
  longitude: -49.4,
  municipality: 'Urubici',
  category: 'mirante',
  tags: [],
}

describe('validateNewPlace', () => {
  it('não acusa nada num lugar válido', () => {
    expect(validateNewPlace(VALID_NEW_PLACE)).toEqual([])
  })

  it('exige nome', () => {
    expect(validateNewPlace({ ...VALID_NEW_PLACE, name: '   ' })).toEqual([
      'name-required',
    ])
  })

  it('limita o tamanho do nome', () => {
    expect(
      validateNewPlace({ ...VALID_NEW_PLACE, name: 'a'.repeat(121) }),
    ).toEqual(['name-too-long'])
  })

  it('rejeita coordenada fora de faixa, espelhando as checks do banco', () => {
    expect(validateNewPlace({ ...VALID_NEW_PLACE, latitude: -91 })).toEqual([
      'latitude-out-of-range',
    ])
    expect(validateNewPlace({ ...VALID_NEW_PLACE, longitude: 181 })).toEqual([
      'longitude-out-of-range',
    ])
  })

  it('rejeita categoria fora da lista', () => {
    expect(
      validateNewPlace({
        ...VALID_NEW_PLACE,
        category: 'vulcao' as NewPlace['category'],
      }),
    ).toEqual(['invalid-category'])
  })

  it('acumula erros em vez de parar no primeiro', () => {
    expect(
      validateNewPlace({ ...VALID_NEW_PLACE, name: '', latitude: 99 }),
    ).toEqual(['name-required', 'latitude-out-of-range'])
  })

  it('tem mensagem em PT-BR para todo erro possível', () => {
    const errors = validateNewPlace({
      ...VALID_NEW_PLACE,
      name: '',
      latitude: 99,
    })
    expect(errors.length).toBeGreaterThan(0)
    for (const error of errors) {
      expect(PLACE_VALIDATION_MESSAGES[error]).toBeTruthy()
    }
  })
})
