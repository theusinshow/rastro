import type { SymbolLayerSpecification } from 'maplibre-gl'
import type { FuelStation } from '@/domain/fuel-stations'
import { buildDiamondIcon, type RasterIcon } from './fuel-icon'
import { paletteFor, type MapTheme } from './palette'

export const FUEL_SOURCE_ID = 'fuel-stations'

/** Na ordem de remoção: o rótulo sai antes do marcador que ele nomeia. */
export const FUEL_LAYERS = {
  label: 'fuel-stations-label',
  marker: 'fuel-stations-marker',
} as const

/** Ids das imagens registradas no estilo. Um por estado, e só dois estados. */
export const FUEL_ICONS = {
  base: 'fuel-diamond',
  selected: 'fuel-diamond-selected',
} as const

/**
 * Lado da imagem, em pixels de dispositivo.
 *
 * Gerada em 2× e registrada com `pixelRatio: 2`: em tela retina um losango de
 * 15px desenhado a 15px sai borrado, e o marcador de um serviço não pode
 * parecer defeito. Ímpar para que o centro caia num pixel.
 */
const ICON_SIZE = 29
const ICON_SIZE_SELECTED = 39
export const ICON_PIXEL_RATIO = 2

/** Propriedades levadas ao mapa. Só o que alguma camada realmente lê. */
export interface FuelFeatureProperties {
  id: string
  name: string
  selected: boolean
}

export interface FuelFeatureCollection {
  type: 'FeatureCollection'
  features: {
    type: 'Feature'
    id: string
    geometry: { type: 'Point'; coordinates: [number, number] }
    properties: FuelFeatureProperties
  }[]
}

/**
 * A fonte recebe só os postos da busca atual.
 *
 * Diferente de `buildPlacesGeoJson`, que manda o catálogo inteiro sempre: lá o
 * recorte muda a toda hora e o crossfade precisa de quem saiu ainda presente.
 * Aqui não há recorte — ou a camada está ligada e há uma busca, ou ela não
 * existe. Desligar remove a fonte.
 */
export function buildFuelStationsGeoJson(
  stations: readonly FuelStation[],
  selectedId: string | null = null,
): FuelFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: stations.map((station) => ({
      type: 'Feature',
      id: station.id,
      geometry: {
        // GeoJSON é [longitude, latitude]. Trocar a ordem é o erro clássico.
        type: 'Point',
        coordinates: [station.longitude, station.latitude],
      },
      properties: {
        id: station.id,
        name: station.name,
        selected: station.id === selectedId,
      },
    })),
  }
}

/**
 * As duas imagens do losango, na paleta do tema.
 *
 * O contorno é a cor do FUNDO do mapa, e não uma tinta: ele existe para descolar
 * o marcador do terreno, do mesmo jeito que o halo descola um rótulo do que
 * passa embaixo dele. O selecionado troca o contorno pela cor da tinta (`bone`)
 * e cresce — a mesma gramática do anel de seleção dos pins do catálogo, que
 * também é `bone` e também cresce.
 */
export function buildFuelIcons(
  theme: MapTheme = 'escuro',
): Array<{ id: string; icon: RasterIcon }> {
  const { pin, map } = paletteFor(theme)

  return [
    {
      id: FUEL_ICONS.base,
      icon: buildDiamondIcon({
        size: ICON_SIZE,
        fill: pin.fuel,
        stroke: map.background,
        strokeWidth: 3,
      }),
    },
    {
      id: FUEL_ICONS.selected,
      icon: buildDiamondIcon({
        size: ICON_SIZE_SELECTED,
        fill: pin.fuel,
        stroke: pin.bone,
        strokeWidth: 3,
      }),
    },
  ]
}

export function buildFuelLayers(
  theme: MapTheme = 'escuro',
): SymbolLayerSpecification[] {
  const { map } = paletteFor(theme)

  return [
    {
      id: FUEL_LAYERS.marker,
      type: 'symbol',
      source: FUEL_SOURCE_ID,
      layout: {
        'icon-image': [
          'case',
          ['get', 'selected'],
          FUEL_ICONS.selected,
          FUEL_ICONS.base,
        ],
        /*
         * `icon-allow-overlap`, e `icon-ignore-placement` não.
         *
         * O posto precisa aparecer mesmo colado noutro posto — numa entrada de
         * cidade há três na mesma esquina, e esconder dois seria esconder a
         * resposta. Mas ele NÃO é ignorado no cálculo de colisão dos outros
         * símbolos: um marcador de serviço não pode apagar o nome de um lugar
         * do catálogo, que é o conteúdo do produto.
         */
        'icon-allow-overlap': true,
        'icon-size': ['interpolate', ['linear'], ['zoom'], 6, 0.55, 12, 1],
      },
    },
    {
      id: FUEL_LAYERS.label,
      type: 'symbol',
      source: FUEL_SOURCE_ID,
      // Dois degraus acima do rótulo do catálogo (8.5): a lista da direita já
      // nomeia os postos em ordem de distância, e enchê-los de nome em zoom de
      // estado tiraria do mapa exatamente o que o mapa serve para mostrar.
      minzoom: 10.5,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 10,
        'text-letter-spacing': 0.06,
        'text-offset': [0, 1.2],
        'text-anchor': 'top',
        'text-max-width': 9,
        // Cede à colisão: nome de posto vale menos que nome de lugar, e nome
        // ilegível não vale mais que nenhum.
        'text-allow-overlap': false,
        'text-optional': true,
      },
      paint: {
        'text-color': map.labelSmall,
        'text-halo-color': map.labelHalo,
        'text-halo-width': 1.4,
      },
    },
  ]
}
