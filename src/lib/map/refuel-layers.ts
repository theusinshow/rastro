import type { CircleLayerSpecification, SymbolLayerSpecification } from 'maplibre-gl'
import type { RefuelPoint } from '@/domain/fuel'
import { paletteFor, type MapTheme } from './palette'

export const REFUEL_SOURCE_ID = 'trip-refuel'

/** Na ordem de remoção: o rótulo sai antes da marca que ele nomeia. */
export const REFUEL_LAYERS = ['trip-refuel-label', 'trip-refuel-mark'] as const

export interface RefuelFeatureCollection {
  type: 'FeatureCollection'
  features: {
    type: 'Feature'
    id: number
    geometry: { type: 'Point'; coordinates: [number, number] }
    properties: { atKm: number; label: string }
  }[]
}

/**
 * Onde o tanque acaba, pronto para o mapa.
 *
 * O rótulo é montado aqui, e não na camada, porque `text-field` com concatenação
 * de expressão para número vira `['concat', 'km ', ['to-string', ...]]` — uma
 * linha ilegível para dizer o que uma interpolação de string diz.
 */
export function buildRefuelGeoJson(
  points: readonly RefuelPoint[],
): RefuelFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: points.map((point, index) => ({
      type: 'Feature',
      id: index,
      // GeoJSON é [longitude, latitude].
      geometry: {
        type: 'Point',
        coordinates: [point.coordinates.longitude, point.coordinates.latitude],
      },
      properties: { atKm: point.atKm, label: `km ${point.atKm}` },
    })),
  }
}

/**
 * A marca do fim do tanque: um anel de tinta **cortando o asfalto**.
 *
 * Por que não âmbar: o traçado da viagem JÁ é âmbar, e um anel âmbar sobre uma
 * linha âmbar é um anel invisível. A tinta (`bone`) é a cor que este mapa reserva
 * para o que se destaca sobre o desenho — é o anel de seleção dos pins, e aqui
 * não há pin de catálogo com que competir: a rota da viagem não monta o
 * `PlacesLayer`.
 *
 * Por que anel vazado, e não disco cheio: o miolo é a cor do FUNDO do mapa, e
 * isso faz a marca ler como uma interrupção da estrada, não como um objeto
 * pousado em cima dela. É a mesma ideia da faixa central tracejada do traçado —
 * asfalto cortado — e é literalmente o que um tanque vazio é.
 *
 * Não é um terceiro tipo de pin: é o mesmo vocabulário (anel de tinta) aplicado
 * a uma linha em vez de a um ponto de catálogo.
 */
export function buildRefuelLayers(
  theme: MapTheme = 'escuro',
): Array<CircleLayerSpecification | SymbolLayerSpecification> {
  const { pin, map } = paletteFor(theme)

  return [
    {
      id: 'trip-refuel-mark',
      type: 'circle',
      source: REFUEL_SOURCE_ID,
      paint: {
        'circle-color': map.background,
        'circle-stroke-color': pin.bone,
        'circle-stroke-width': 2,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 4, 12, 7],
      },
    },
    {
      id: 'trip-refuel-label',
      type: 'symbol',
      source: REFUEL_SOURCE_ID,
      layout: {
        'text-field': ['get', 'label'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 11,
        'text-letter-spacing': 0.06,
        'text-offset': [0, 1.2],
        'text-anchor': 'top',
        // NÃO cede à colisão, ao contrário do rótulo de posto e do de lugar.
        // Este número é a resposta da seção "onde abastecer" — um `km 315` que
        // some porque um nome de município ocupou o espaço deixa a marca no mapa
        // sem dizer o que ela é.
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': pin.bone,
        'text-halo-color': map.labelHalo,
        'text-halo-width': 1.6,
      },
    },
  ]
}
