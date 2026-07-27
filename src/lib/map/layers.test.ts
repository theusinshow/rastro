import { describe, expect, it } from 'vitest'
import { buildPlacesGeoJson } from './layers'
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
    ...overrides,
  }
}

describe('buildPlacesGeoJson', () => {
  it('devolve uma FeatureCollection vazia sem lugares', () => {
    const result = buildPlacesGeoJson([])
    expect(result.type).toBe('FeatureCollection')
    expect(result.features).toHaveLength(0)
  })

  it('usa a ordem longitude, latitude exigida pelo GeoJSON', () => {
    const result = buildPlacesGeoJson([place({ latitude: -27.6, longitude: -48.5 })])
    expect(result.features[0]!.geometry.coordinates).toEqual([-48.5, -27.6])
  })

  it('expõe os três canais visuais como propriedades', () => {
    const result = buildPlacesGeoJson([
      place({ slug: 'a', visitStatus: 'visitado', isFavorite: true, photoCount: 12 }),
    ])
    const properties = result.features[0]!.properties

    expect(properties.slug).toBe('a')
    expect(properties.visitStatus).toBe('visitado')
    expect(properties.isFavorite).toBe(true)
    expect(properties.hasPhotos).toBe(true)
  })

  it('converte contagem de fotos em booleano', () => {
    const result = buildPlacesGeoJson([place({ photoCount: 0 })])
    expect(result.features[0]!.properties.hasPhotos).toBe(false)
  })

  it('usa o slug como id da feature, para permitir feature-state', () => {
    const result = buildPlacesGeoJson([place({ slug: 'urubici' })])
    expect(result.features[0]!.id).toBe('urubici')
  })
})
