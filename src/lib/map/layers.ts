import type {
  CircleLayerSpecification,
  ExpressionSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl'
import type { ExplorePlace } from '@/domain/place'
import { paletteFor, type MapTheme, type PinPalette } from './palette'

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
  /** Quantas visitas registradas. Dirige o tamanho do pin — ver `weightFactor`. */
  visitCount: number
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
 * interpolar uma feature que deixou de existir: marcar "Cachoeira" fazia quase
 * todos os pins sumirem em um quadro — 13 dos 14 que o catálogo tinha na
 * medição —, sem que o usuário tivesse como saber se removeu demais ou se o
 * mapa quebrou. Quem decide o recorte continua sendo
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
        visitCount: place.visits.length,
        matched: matched.has(place.slug),
        wasMatched: previouslyMatched.has(place.slug),
      },
    })),
  }
}

// As cores vêm de `palette.ts`, que guarda as duas variantes lado a lado: o
// MapLibre desenha em WebGL e não enxerga variáveis CSS.

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
  return weightedRadius(11 * scale, 16 * scale)
}

/** Realce do pin correspondente à linha sob o cursor na lista. */
export function hoverRadius(progress: number): CircleRadius {
  const scale = 0.6 + 0.4 * progress
  return weightedRadius(9 * scale, 13 * scale)
}

/**
 * Multiplicador de raio pelo número de visitas.
 *
 * Um lugar onde você voltou cinco vezes desenha maior que um onde passou uma
 * vez. O mapa deixa de mostrar só *onde* os lugares estão e passa a mostrar
 * **onde a sua vida aconteceu mais** — que é a diferença entre um catálogo e uma
 * memória.
 *
 * Trava em cinco visitas. Sem teto, um lugar de rotina viraria um disco que
 * engole os vizinhos e o mapa perderia mais informação do que ganharia. A escala
 * é modesta de propósito: 60% de crescimento no extremo, não o dobro.
 *
 * `interpolate` devolve o valor da ponta fora da faixa, então quem tem quinze
 * visitas fica no mesmo tamanho de quem tem cinco.
 */
function weightFactor(): ExpressionSpecification {
  return ['interpolate', ['linear'], ['get', 'visitCount'], 0, 1, 1, 1.18, 5, 1.6]
}

/**
 * Raio base por zoom, multiplicado pelo peso da visita.
 *
 * Os anéis externos usam o mesmo par para crescerem junto: se só o miolo
 * crescesse, o anel de favorito descolaria e o pin leria como dois objetos.
 *
 * **A interpolação por `zoom` precisa ser a expressão mais externa.** Aninhá-la
 * dentro do `*` é inválido na especificação de estilo, e o MapLibre rejeita a
 * camada inteira em silêncio: os pins simplesmente não desenhavam, sem
 * erro no console e sem falha no `load`. Por isso o peso multiplica cada parada
 * da escala, em vez de multiplicar a escala inteira.
 */
function weightedRadius(near: number, far: number): ExpressionSpecification {
  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    6,
    ['*', near, weightFactor()],
    12,
    ['*', far, weightFactor()],
  ]
}

/** Miolo preenchido para visitado e quero conhecer; vazado para não visitado. */
function coreFill(pin: PinPalette): CircleLayerSpecification['paint'] {
  return {
    'circle-color': [
      'match',
      ['get', 'visitStatus'],
      'visitado',
      pin.visited,
      'quero-conhecer',
      pin.wanted,
      pin.hollow,
    ],
    'circle-stroke-color': [
      'match',
      ['get', 'visitStatus'],
      'visitado',
      pin.visited,
      'quero-conhecer',
      pin.wanted,
      pin.unvisited,
    ],
    'circle-stroke-width': 1.4,
    'circle-radius': weightedRadius(3.5, 6.5),
    'circle-opacity': matchFadeOpacity(1),
    'circle-stroke-opacity': matchFadeOpacity(1),
  }
}

export function buildPlaceLayers(theme: MapTheme = 'escuro'): Array<
  CircleLayerSpecification | SymbolLayerSpecification
> {
  const { pin, map } = paletteFor(theme)
  const label = { large: map.labelLarge, halo: map.labelHalo }

  return [
    {
      id: PLACE_LAYERS.favoriteRing,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      filter: ['==', ['get', 'isFavorite'], true],
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': pin.bone,
        'circle-stroke-width': 1,
        'circle-stroke-opacity': matchFadeOpacity(1, 0.55),
        'circle-radius': weightedRadius(7, 11),
      },
    },
    {
      id: PLACE_LAYERS.core,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      // A opacidade já esconde quem saiu do recorte; o filtro existe para que
      // um pin invisível não continue capturando clique depois do crossfade.
      filter: IN_TRANSITION,
      paint: coreFill(pin),
    },
    {
      id: PLACE_LAYERS.photoDot,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      filter: ['==', ['get', 'hasPhotos'], true],
      paint: {
        'circle-color': pin.bone,
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
        'circle-stroke-color': pin.bone,
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
        'circle-stroke-color': pin.bone,
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
        // O rótulo cede à colisão e o pin fica: `text-optional` deixa o
        // MapLibre descartar só o texto quando não há espaço. Em Urubici há
        // três lugares a poucos quilômetros um do outro — permitir
        // sobreposição empilharia nomes ilegíveis exatamente onde o catálogo
        // é mais denso, e um nome ilegível não vale mais que nenhum.
        'text-allow-overlap': false,
        'text-optional': true,
      },
      paint: {
        // Sobrou da paleta anterior — um cinza esverdeado que não existe em
        // token nenhum desde o ADR 0012. O nome do lugar é o texto mais
        // importante do mapa e estava numa cor de nenhum lugar.
        'text-color': label.large,
        'text-halo-color': label.halo,
        'text-halo-width': 1.4,
        'text-opacity': matchFadeTextOpacity(1),
      },
    },
  ]
}
