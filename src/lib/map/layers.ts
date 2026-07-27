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
  hover: 'places-hover',
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
  /** Dentro do recorte atual (filtro do Explore, resultado da descoberta). */
  matched: boolean
  /** Dentro do recorte anterior. Existe só para o crossfade — ver `paint.ts`. */
  wasMatched: boolean
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

/**
 * Todos os lugares vão para a fonte, sempre — inclusive os que o recorte
 * excluiu.
 *
 * A fonte recebia antes a lista já filtrada, e o MapLibre não consegue
 * interpolar uma feature que deixou de existir: marcar "Cachoeira" fazia 13 dos
 * 14 pins sumirem em um quadro, sem que o usuário tivesse como saber se removeu
 * demais ou se o mapa quebrou. Quem decide o recorte continua sendo
 * `filterPlaces` no domínio; o que muda é que o recorte chega aqui como a
 * propriedade `matched` em vez de como ausência.
 *
 * `previouslyMatched` é o recorte anterior. Quando os dois são iguais não há
 * transição a fazer e a opacidade fica no valor final, qualquer que seja o
 * progresso.
 */
export function buildPlacesGeoJson(
  places: readonly ExplorePlace[],
  matched: ReadonlySet<string>,
  previouslyMatched: ReadonlySet<string> = matched,
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
        matched: matched.has(place.slug),
        wasMatched: previouslyMatched.has(place.slug),
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

type CirclePaint = NonNullable<CircleLayerSpecification['paint']>
type CircleOpacity = NonNullable<CirclePaint['circle-opacity']>
type CircleRadius = NonNullable<CirclePaint['circle-radius']>
type TextOpacity = NonNullable<
  NonNullable<SymbolLayerSpecification['paint']>['text-opacity']
>

/** Está no recorte atual ou no anterior — ou seja, precisa ser desenhado. */
const IN_TRANSITION: CircleLayerSpecification['filter'] = [
  'any',
  ['get', 'matched'],
  ['get', 'wasMatched'],
]

/**
 * Opacidade de uma feature durante o crossfade de recorte.
 *
 * Quem entrou sobe de 0 a `scale`; quem saiu desce de `scale` a 0; quem ficou
 * não se move. `progress` vem de um `requestAnimationFrame` nosso porque o
 * MapLibre ignora `*-transition` em valor dirigido por dados — ver
 * `src/lib/motion/animate-progress.ts`.
 */
export function matchFadeOpacity(progress: number, scale = 1): CircleOpacity {
  return [
    'case',
    ['all', ['get', 'matched'], ['get', 'wasMatched']],
    scale,
    ['get', 'matched'],
    scale * progress,
    ['get', 'wasMatched'],
    scale * (1 - progress),
    0,
  ]
}

/** Mesma curva de `matchFadeOpacity`, no tipo que a camada de rótulo aceita. */
export function matchFadeTextOpacity(progress: number): TextOpacity {
  return matchFadeOpacity(progress) as TextOpacity
}

/**
 * Raio do anel de seleção. Cresce a partir do miolo em vez de nascer no tamanho
 * final: com vários pins agrupados perto de Florianópolis em zoom 8, um anel que
 * simplesmente aparece não diz qual pin foi selecionado.
 */
export function selectionRadius(progress: number): CircleRadius {
  const scale = 0.55 + 0.45 * progress
  return ['interpolate', ['linear'], ['zoom'], 6, 11 * scale, 12, 16 * scale]
}

/** Realce do pin correspondente à linha sob o cursor na lista. */
export function hoverRadius(progress: number): CircleRadius {
  const scale = 0.6 + 0.4 * progress
  return ['interpolate', ['linear'], ['zoom'], 6, 9 * scale, 12, 13 * scale]
}

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
  'circle-opacity': matchFadeOpacity(1),
  'circle-stroke-opacity': matchFadeOpacity(1),
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
        'circle-stroke-opacity': matchFadeOpacity(1, 0.55),
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 7, 12, 11],
      },
    },
    {
      id: PLACE_LAYERS.core,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      // A opacidade já esconde quem saiu do recorte; o filtro existe para que
      // um pin invisível não continue capturando clique depois do crossfade.
      filter: IN_TRANSITION,
      paint: CORE_FILL,
    },
    {
      id: PLACE_LAYERS.photoDot,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      filter: ['==', ['get', 'hasPhotos'], true],
      paint: {
        'circle-color': BONE,
        'circle-opacity': matchFadeOpacity(1, 0.8),
        'circle-radius': 1.7,
        // Deslocado para o canto superior direito do pin.
        'circle-translate': [8, -8],
      },
    },
    {
      id: PLACE_LAYERS.hover,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      filter: ['==', ['get', 'slug'], '__none__'],
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': BONE,
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.9,
        'circle-radius': hoverRadius(1),
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
        'circle-stroke-opacity': 1,
        'circle-radius': selectionRadius(1),
      },
    },
    {
      id: PLACE_LAYERS.label,
      type: 'symbol',
      source: PLACES_SOURCE_ID,
      minzoom: 8.5,
      // Rótulo com opacidade zero continua ocupando caixa de colisão e
      // empurraria para fora o rótulo de um lugar que está no recorte.
      filter: IN_TRANSITION,
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
        'text-opacity': matchFadeTextOpacity(1),
      },
    },
  ]
}
