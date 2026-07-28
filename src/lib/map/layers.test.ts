import { describe, expect, it } from 'vitest'
import { buildPlacesGeoJson, matchFadeOpacity } from './layers'
import type { ExplorePlace } from '@/domain/place'

function place(overrides: Partial<ExplorePlace>): ExplorePlace {
  return {
    id: 'x',
    slug: 'x',
    name: 'X',
    description: '',
    latitude: -27.6,
    longitude: -48.5,
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
    visits: [],
    isOwn: false,
    ...overrides,
  }
}

/** O recorte que casa com o `slug` padrão da fábrica acima. */
const ALL: ReadonlySet<string> = new Set(['x'])

describe('buildPlacesGeoJson', () => {
  it('devolve uma FeatureCollection vazia sem lugares', () => {
    const result = buildPlacesGeoJson([], new Set())
    expect(result.type).toBe('FeatureCollection')
    expect(result.features).toHaveLength(0)
  })

  it('usa a ordem longitude, latitude exigida pelo GeoJSON', () => {
    const result = buildPlacesGeoJson([place({ latitude: -27.6, longitude: -48.5 })], ALL)
    expect(result.features[0]!.geometry.coordinates).toEqual([-48.5, -27.6])
  })

  it('expõe os três canais visuais como propriedades', () => {
    const result = buildPlacesGeoJson(
      [place({ slug: 'a', visitStatus: 'visitado', isFavorite: true, photoCount: 12 })],
      new Set(['a']),
    )
    const properties = result.features[0]!.properties

    expect(properties.slug).toBe('a')
    expect(properties.visitStatus).toBe('visitado')
    expect(properties.isFavorite).toBe(true)
    expect(properties.hasPhotos).toBe(true)
  })

  it('converte contagem de fotos em booleano', () => {
    const result = buildPlacesGeoJson([place({ photoCount: 0 })], ALL)
    expect(result.features[0]!.properties.hasPhotos).toBe(false)
  })

  it('usa o slug como id da feature, para permitir feature-state', () => {
    const result = buildPlacesGeoJson([place({ slug: 'urubici' })], new Set(['urubici']))
    expect(result.features[0]!.id).toBe('urubici')
  })
})

describe('buildPlacesGeoJson — recorte', () => {
  const places = [place({ slug: 'a' }), place({ slug: 'b' }), place({ slug: 'c' })]

  it('leva ao mapa todos os lugares, e não só os do recorte', () => {
    const result = buildPlacesGeoJson(places, new Set(['a']))
    expect(result.features).toHaveLength(3)
  })

  it('marca quem está dentro e quem está fora do recorte', () => {
    const result = buildPlacesGeoJson(places, new Set(['a', 'c']))
    expect(result.features.map((feature) => feature.properties.matched)).toEqual([
      true,
      false,
      true,
    ])
  })

  it('sem recorte anterior, o atual também vale como anterior', () => {
    const result = buildPlacesGeoJson(places, new Set(['b']))
    const b = result.features[1]!.properties
    expect(b.matched).toBe(true)
    expect(b.wasMatched).toBe(true)
  })

  it('guarda o recorte anterior para o crossfade', () => {
    const result = buildPlacesGeoJson(places, new Set(['a']), new Set(['a', 'b']))
    expect(
      result.features.map((feature) => [
        feature.properties.matched,
        feature.properties.wasMatched,
      ]),
    ).toEqual([
      [true, true],
      [false, true],
      [false, false],
    ])
  })
})

/**
 * Os quatro valores da expressão `case`, na ordem em que ela os declara:
 * ficou no recorte, entrou, saiu, nunca esteve.
 */
function fadeValues(progress: number, scale?: number): number[] {
  const expression = matchFadeOpacity(progress, scale) as unknown as unknown[]
  return expression.filter((item): item is number => typeof item === 'number')
}

describe('matchFadeOpacity', () => {
  it('deixa quem ficou no recorte parado em qualquer progresso', () => {
    expect(fadeValues(0)[0]).toBe(1)
    expect(fadeValues(1)[0]).toBe(1)
  })

  it('faz quem entrou subir e quem saiu descer', () => {
    expect(fadeValues(0)).toEqual([1, 0, 1, 0])
    expect(fadeValues(0.5)).toEqual([1, 0.5, 0.5, 0])
    expect(fadeValues(1)).toEqual([1, 1, 0, 0])
  })

  it('aplica a escala da camada sem perder a curva', () => {
    expect(fadeValues(1, 0.55)).toEqual([0.55, 0.55, 0, 0])
  })
})
