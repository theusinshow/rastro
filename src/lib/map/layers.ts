import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl'
import type { ExplorePlace } from '@/domain/place'

export const PLACES_SOURCE_ID = 'places'

export const PLACE_LAYERS = {
  favoriteRing: 'places-favorite-ring',
  core: 'places-core',
  photoDot: 'places-photo-dot',
  selected: 'places-selected',
  label: 'places-label',
} as const

/** Propriedades levadas ao mapa. Só o que alguma camada realmente lê. */
export interface PlaceFeatureProperties {
  slug: string
  name: string
  visitStatus: string
  isFavorite: boolean
  hasPhotos: boolean
}

export interface PlaceFeature {
  type: 'Feature'
  id: string
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: PlaceFeatureProperties
}

export interface PlaceFeatureCollection {
  type: 'FeatureCollection'
  features: PlaceFeature[]
}

export function buildPlacesGeoJson(
  places: readonly ExplorePlace[],
): PlaceFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: places.map((place) => ({
      type: 'Feature',
      id: place.slug,
      geometry: {
        type: 'Point',
        // GeoJSON é [longitude, latitude]. Trocar a ordem é o erro clássico.
        coordinates: [place.longitude, place.latitude],
      },
      properties: {
        slug: place.slug,
        name: place.name,
        visitStatus: place.visitStatus,
        isFavorite: place.isFavorite,
        hasPhotos: place.photoCount > 0,
      },
    })),
  }
}

// Cores duplicadas dos tokens CSS de propósito: o MapLibre desenha em WebGL e
// não enxerga variáveis CSS. Ao alterar um token, altere aqui também.
const VISITED = '#3fbf8f'
const WANTED = '#f0a32b'
const UNVISITED = '#7d8a85'
const HOLLOW = '#141a18'
const BONE = '#e8edea'

/** Miolo preenchido para visitado e quero conhecer; vazado para não visitado. */
const CORE_FILL: CircleLayerSpecification['paint'] = {
  'circle-color': [
    'match',
    ['get', 'visitStatus'],
    'visitado',
    VISITED,
    'quero-conhecer',
    WANTED,
    HOLLOW,
  ],
  'circle-stroke-color': [
    'match',
    ['get', 'visitStatus'],
    'visitado',
    VISITED,
    'quero-conhecer',
    WANTED,
    UNVISITED,
  ],
  'circle-stroke-width': 1.4,
  'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 3.5, 12, 6.5],
}

export function buildPlaceLayers(): Array<
  CircleLayerSpecification | SymbolLayerSpecification
> {
  return [
    {
      id: PLACE_LAYERS.favoriteRing,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      filter: ['==', ['get', 'isFavorite'], true],
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': BONE,
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.55,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 7, 12, 11],
      },
    },
    {
      id: PLACE_LAYERS.core,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      paint: CORE_FILL,
    },
    {
      id: PLACE_LAYERS.photoDot,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      filter: ['==', ['get', 'hasPhotos'], true],
      paint: {
        'circle-color': BONE,
        'circle-opacity': 0.8,
        'circle-radius': 1.7,
        // Deslocado para o canto superior direito do pin.
        'circle-translate': [8, -8],
      },
    },
    {
      id: PLACE_LAYERS.selected,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      // Sem seleção o filtro não casa com nada e a camada fica invisível.
      filter: ['==', ['get', 'slug'], '__none__'],
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': BONE,
        'circle-stroke-width': 1.2,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 11, 12, 16],
      },
    },
    {
      id: PLACE_LAYERS.label,
      type: 'symbol',
      source: PLACES_SOURCE_ID,
      minzoom: 8.5,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 10.5,
        'text-letter-spacing': 0.06,
        'text-offset': [0, 1.3],
        'text-anchor': 'top',
        'text-max-width': 9,
        // Rótulo de pin nunca some por colisão: perder o nome do destino é
        // pior do que sobrepor um rótulo da base.
        'text-allow-overlap': false,
        'text-optional': true,
      },
      paint: {
        'text-color': '#c3ccc8',
        'text-halo-color': '#0a0c0b',
        'text-halo-width': 1.4,
      },
    },
  ]
}
