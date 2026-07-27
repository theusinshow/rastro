import type { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl'
import { boundingBox, type Coordinates } from '@/domain/geo'

/**
 * Tempos da câmera.
 *
 * Escala própria, maior que a dos tokens de interface em `globals.css`: aqui o
 * movimento é navegação sobre uma superfície contínua, e o olho precisa
 * acompanhar o trajeto para não perder a referência de onde estava.
 */
const PAN_MS = 600
const FLY_MS = 900
const FIT_MS = 700

/** Zoom mínimo ao trazer um lugar escolhido numa lista para o centro. */
const FOCUS_ZOOM = 10

/** Enquadrar seis destinos no estado inteiro não deve virar zoom de rua. */
const FIT_MAX_ZOOM = 11

/** `ease-out-quart`, a mesma curva de `--ease-out-quart` em `globals.css`. */
function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/**
 * Padding pedido, reduzido ao que cabe.
 *
 * As colunas somam 612px de 1512 no desktop, e é isso que impede o pin
 * selecionado de terminar embaixo de um painel. Numa folha inferior de celular
 * os mesmos números deixariam a área útil negativa e o MapLibre enquadraria
 * fora do mapa — por isso o padding é descartado quando não cabe, em vez de
 * aplicado às cegas.
 */
function usable(map: MapLibreMap, padding: PaddingOptions): PaddingOptions {
  const canvas = map.getCanvas()
  const horizontal = (padding.left ?? 0) + (padding.right ?? 0)
  const vertical = (padding.top ?? 0) + (padding.bottom ?? 0)
  const fitsHorizontally = horizontal < canvas.clientWidth * 0.7
  const fitsVertically = vertical < canvas.clientHeight * 0.7

  return {
    left: fitsHorizontally ? (padding.left ?? 0) : 0,
    right: fitsHorizontally ? (padding.right ?? 0) : 0,
    top: fitsVertically ? (padding.top ?? 0) : 0,
    bottom: fitsVertically ? (padding.bottom ?? 0) : 0,
  }
}

/**
 * Traz um lugar para a área visível do mapa.
 *
 * `zoomIn` distingue as duas origens de seleção. Clicar num pin é só
 * reposicionar: o usuário já sabe onde o lugar está e mexer no zoom seria
 * desorientador. Clicar numa linha de lista é outra pergunta — "qual dos pins é
 * esse?" — e aí aproximar é a resposta.
 *
 * Nenhuma chamada passa `essential: true`, de propósito: o MapLibre honra
 * `prefers-reduced-motion` sozinho e corta seco em vez de viajar.
 */
export function focusPlace(
  map: MapLibreMap,
  target: Coordinates,
  padding: PaddingOptions,
  { zoomIn }: { zoomIn: boolean },
): void {
  const center: [number, number] = [target.longitude, target.latitude]
  const options = { center, padding: usable(map, padding), easing: easeOutQuart }

  if (zoomIn) {
    map.flyTo({
      ...options,
      zoom: Math.max(map.getZoom(), FOCUS_ZOOM),
      duration: FLY_MS,
    })
    return
  }

  map.easeTo({ ...options, duration: PAN_MS })
}

/**
 * Recompõe o mapa para mostrar exatamente o conjunto recebido.
 *
 * É a resposta a "para onde vamos?": sem isto o usuário responde quatro
 * perguntas, aperta o botão e o enquadramento fica idêntico ao inicial, com
 * parte dos destinos fora de tela.
 */
export function fitPlaces(
  map: MapLibreMap,
  targets: readonly Coordinates[],
  padding: PaddingOptions,
): void {
  const bounds = boundingBox(targets)
  if (!bounds) return

  map.fitBounds(
    [
      [bounds.west, bounds.south],
      [bounds.east, bounds.north],
    ],
    {
      padding: usable(map, padding),
      maxZoom: FIT_MAX_ZOOM,
      duration: FIT_MS,
      easing: easeOutQuart,
    },
  )
}
