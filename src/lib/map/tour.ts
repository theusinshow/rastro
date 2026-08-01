import type { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl'
import { easeInOutSine } from '@/lib/motion/animate-progress'
import { usable } from './camera'

/** O que a câmera precisa saber para visitar um lugar. */
export interface TourStop {
  latitude: number
  longitude: number
}

/** Tempo de voo entre dois lugares. */
export const FLY_MS = 4_000

/** Tempo parado sobre um lugar, para dar tempo de ler o painel. */
export const HOLD_MS = 3_500

const ZOOM = 11.2
const PITCH = 55
const TERRAIN_EXAGGERATION = 1.4

/**
 * Ângulos de aproximação, em rodízio.
 *
 * Chegar sempre pelo mesmo lado faz catorze lugares diferentes parecerem o mesmo
 * lugar. Quatro ângulos bastam para quebrar isso, e são **determinísticos** de
 * propósito: `Math.random()` faria o passeio ser irreprodutível entre execuções,
 * e este código roda também no ambiente de teste.
 */
const BEARINGS = [-32, 18, -12, 40] as const

/**
 * A câmera para o enésimo lugar do passeio.
 *
 * Pura e exportada porque é o miolo testável: o resto do módulo é efeito
 * colateral sobre o MapLibre, que teste de unidade não alcança.
 */
export function tourShotFor(stop: TourStop, index: number) {
  return {
    center: [stop.longitude, stop.latitude] as [number, number],
    zoom: ZOOM,
    pitch: PITCH,
    bearing: BEARINGS[index % BEARINGS.length]!,
  }
}

interface TourOptions {
  padding?: PaddingOptions
  /** Avisa qual lugar está em foco, para o painel acompanhar. */
  onStopChange?: (index: number) => void
}

/**
 * Um passeio contínuo pelos lugares do catálogo.
 *
 * Difere do `flyover.ts`, que percorre **um** caminho sobre a Serra do Rio do
 * Rastro e pousa: aqui a câmera visita um lugar, segura, e vai para o próximo,
 * em ciclo. A auditoria registrou que uma animação de onze segundos repetindo
 * igual cansa quem volta (RASTRO-010); um passeio que troca de assunto, não.
 *
 * Usa `flyTo` do MapLibre em vez de interpolar quadro a quadro como o sobrevoo
 * faz. A razão é a costura: no sobrevoo ela apareceria no meio de um movimento
 * único e contínuo, e aqui cada perna **é** um movimento separado, com pausa
 * entre elas — o arco do `flyTo` é exatamente o que se quer.
 *
 * @returns função que interrompe o passeio e desliga o relevo.
 */
export function runTour(
  map: MapLibreMap,
  stops: readonly TourStop[],
  { padding, onStopChange }: TourOptions = {},
): () => void {
  if (stops.length === 0) return () => {}

  try {
    map.setTerrain({ source: 'terrain', exaggeration: TERRAIN_EXAGGERATION })
  } catch {
    // Estilo sem fonte de relevo, ou WebGL sem folga. O passeio segue em 2D.
  }

  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let index = 0

  function visit() {
    if (cancelled) return

    const stop = stops[index % stops.length]!
    const shot = tourShotFor(stop, index)
    onStopChange?.(index % stops.length)

    map.flyTo({
      ...shot,
      duration: FLY_MS,
      easing: easeInOutSine,
      ...(padding ? { padding: usable(map, padding) } : {}),
    })

    index += 1
    timer = setTimeout(visit, FLY_MS + HOLD_MS)
  }

  visit()

  return () => {
    cancelled = true
    if (timer) clearTimeout(timer)
    map.stop()
    try {
      map.setTerrain(null)
    } catch {
      // Mapa já destruído. Nada a desfazer.
    }
  }
}

/**
 * Põe a câmera sobre um lugar, plana e sem viagem.
 *
 * O caminho de quem pediu movimento reduzido: o produto ainda se apresenta, com
 * um lugar de verdade na tela, mas nada se move.
 */
export function showStopImmediately(
  map: MapLibreMap,
  stop: TourStop,
  padding?: PaddingOptions,
): void {
  map.jumpTo({
    center: [stop.longitude, stop.latitude],
    zoom: 9.6,
    pitch: 0,
    bearing: 0,
    ...(padding ? { padding: usable(map, padding) } : {}),
  })
}
