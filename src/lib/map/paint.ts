import type { Map as MapLibreMap } from 'maplibre-gl'
import {
  PLACE_LAYERS,
  hoverRadius,
  matchFadeOpacity,
  matchFadeTextOpacity,
  selectionRadius,
} from './layers'

/** Crossfade do recorte. Entrada um pouco mais longa que a saída. */
export const MATCH_FADE_MS = 220

/** O anel cresce, assenta e para. Sem pulso em loop. */
export const SELECTION_GROW_MS = 240

export const HOVER_GROW_MS = 140

/**
 * Escreve um quadro do crossfade de recorte nas camadas de lugar.
 *
 * O MapLibre reavalia a expressão a cada `setPaintProperty`, e é assim que a
 * interpolação chega ao WebGL: a biblioteca ignora `*-transition` quando o
 * valor depende de `['get', ...]`. Com catorze pontos o custo é irrelevante.
 */
export function applyMatchFade(map: MapLibreMap, progress: number): void {
  if (!map.getLayer(PLACE_LAYERS.core)) return

  map.setPaintProperty(
    PLACE_LAYERS.core,
    'circle-opacity',
    matchFadeOpacity(progress),
  )
  map.setPaintProperty(
    PLACE_LAYERS.core,
    'circle-stroke-opacity',
    matchFadeOpacity(progress),
  )
  map.setPaintProperty(
    PLACE_LAYERS.favoriteRing,
    'circle-stroke-opacity',
    matchFadeOpacity(progress, 0.55),
  )
  map.setPaintProperty(
    PLACE_LAYERS.photoDot,
    'circle-opacity',
    matchFadeOpacity(progress, 0.8),
  )
  map.setPaintProperty(
    PLACE_LAYERS.label,
    'text-opacity',
    matchFadeTextOpacity(progress),
  )
}

export function applySelectionRing(map: MapLibreMap, progress: number): void {
  if (!map.getLayer(PLACE_LAYERS.selected)) return
  map.setPaintProperty(
    PLACE_LAYERS.selected,
    'circle-radius',
    selectionRadius(progress),
  )
  map.setPaintProperty(PLACE_LAYERS.selected, 'circle-stroke-opacity', progress)
}

export function applyHoverRing(map: MapLibreMap, progress: number): void {
  if (!map.getLayer(PLACE_LAYERS.hover)) return
  map.setPaintProperty(PLACE_LAYERS.hover, 'circle-radius', hoverRadius(progress))
  map.setPaintProperty(
    PLACE_LAYERS.hover,
    'circle-stroke-opacity',
    0.9 * progress,
  )
}
