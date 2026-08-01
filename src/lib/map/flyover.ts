import type { Map as MapLibreMap, PaddingOptions } from 'maplibre-gl'
import { animateProgress, easeInOutSine } from '@/lib/motion/animate-progress'
import { usable } from './camera'

/** Uma posição de câmera no caminho. */
export interface CameraShot {
  longitude: number
  latitude: number
  zoom: number
  /** Graus de inclinação. O MapLibre limita em 60 por padrão. */
  pitch: number
  bearing: number
}

/**
 * O caminho da câmera sobre a Serra do Rio do Rastro.
 *
 * São constantes, e não uma consulta ao catálogo, por duas razões: posição de
 * câmera não é dado do produto, e a tela de entrada não deveria depender de uma
 * ida ao banco para desenhar. Mesmo critério do `INITIAL_CENTER` em `config.ts`.
 *
 * A coordenada da serra é real (-28.39, -49.54) — o que é escolha nossa é de
 * onde se olha para ela. O caminho começa alto e a sudeste, desce girando para
 * o norte enquanto se aproxima do paredão, e termina plano.
 */
/**
 * Onde a câmera para.
 *
 * Plana e sem giro de propósito: é o estado em que o produto vive, e é ele que
 * o app recebe quando a pessoa entra. Terminar inclinado obrigaria o app a
 * desfazer a inclinação, e aí a primeira coisa que a pessoa veria depois de
 * entrar seria uma correção.
 */
export const LANDING: CameraShot = {
  longitude: -49.54,
  latitude: -28.39,
  zoom: 9.4,
  pitch: 0,
  bearing: 0,
}

export const SHOTS: readonly CameraShot[] = [
  { longitude: -49.42, latitude: -28.52, zoom: 8.4, pitch: 58, bearing: -34 },
  { longitude: -49.48, latitude: -28.46, zoom: 9.6, pitch: 60, bearing: -20 },
  { longitude: -49.53, latitude: -28.41, zoom: 10.8, pitch: 54, bearing: -8 },
  { longitude: -49.54, latitude: -28.39, zoom: 11.4, pitch: 40, bearing: 0 },
  LANDING,
]

/** Duração do sobrevoo. Longo de propósito: é para ser assistido, não sofrido. */
export const FLYOVER_MS = 11_000

/**
 * Exagero do relevo.
 *
 * Acima de ~1.6 a serra vira maquete e o produto passa a mentir sobre a
 * geografia — que é exatamente o que este sobrevoo existe para NÃO fazer.
 */
const TERRAIN_EXAGGERATION = 1.4

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * t
}

/**
 * A posição da câmera num ponto do caminho.
 *
 * O progresso é distribuído igualmente entre os trechos, e não pela distância
 * percorrida: os trechos foram escritos para terem pesos parecidos, e medir
 * distância em graus de longitude daria peso errado longe do equador.
 *
 * Pura e exportada porque é o miolo testável — o resto do módulo é efeito
 * colateral sobre o MapLibre, que teste de unidade não alcança.
 */
export function shotAt(
  progress: number,
  shots: readonly CameraShot[] = SHOTS,
): CameraShot {
  const clamped = Math.min(1, Math.max(0, progress))
  const last = shots.length - 1
  const scaled = clamped * last
  // `Math.min` prende o índice no penúltimo: em `progress === 1` o piso já é o
  // último, e `shots[index + 1]` sairia do vetor.
  const index = Math.min(Math.floor(scaled), last - 1)
  const t = scaled - index
  const from = shots[index]
  const to = shots[index + 1]

  // Um caminho com menos de dois planos não é caminho. Erro de programação, e
  // não condição de execução — daí lançar em vez de devolver algo plausível.
  if (!from || !to) {
    throw new Error('shotAt precisa de ao menos dois planos de câmera')
  }

  return {
    longitude: lerp(from.longitude, to.longitude, t),
    latitude: lerp(from.latitude, to.latitude, t),
    zoom: lerp(from.zoom, to.zoom, t),
    pitch: lerp(from.pitch, to.pitch, t),
    bearing: lerp(from.bearing, to.bearing, t),
  }
}

function applyShot(
  map: MapLibreMap,
  shot: CameraShot,
  padding: PaddingOptions | undefined,
): void {
  map.jumpTo({
    center: [shot.longitude, shot.latitude],
    zoom: shot.zoom,
    pitch: shot.pitch,
    bearing: shot.bearing,
    ...(padding ? { padding: usable(map, padding) } : {}),
  })
}

/**
 * Põe o mapa direto no ponto de pouso, sem viajar.
 *
 * É o caminho de quem pediu movimento reduzido — e também o de quem chega com o
 * sobrevoo já gasto, navegando de volta para a entrada.
 */
export function landImmediately(
  map: MapLibreMap,
  padding?: PaddingOptions,
): void {
  applyShot(map, LANDING, padding)
}

/**
 * Percorre o caminho quadro a quadro.
 *
 * `jumpTo` a cada quadro, e não uma cadeia de `flyTo`: o `flyTo` do MapLibre
 * impõe a própria curva de voo, que sobe e desce o zoom sozinha, e encadear
 * quatro deles deixaria costuras visíveis em cada emenda. Aqui a curva é uma
 * só, do início ao fim.
 *
 * O relevo 3D usa a fonte `terrain` que o estilo JÁ carrega para o hillshade —
 * nenhum tile novo. Ele é desligado no pouso, onde a câmera está plana e a
 * diferença entre ligado e desligado é imperceptível. Desligar em qualquer
 * outro ponto daria um estalo.
 *
 * @returns função que interrompe o sobrevoo e pousa na hora.
 */
export function runFlyover(
  map: MapLibreMap,
  options: {
    padding?: PaddingOptions
    onLand?: () => void
    durationMs?: number
  } = {},
): () => void {
  const { padding, onLand, durationMs = FLYOVER_MS } = options

  try {
    map.setTerrain({ source: 'terrain', exaggeration: TERRAIN_EXAGGERATION })
  } catch {
    // Estilo sem a fonte de relevo, ou WebGL sem folga para ela. O sobrevoo
    // continua em 2D: pior do que poderia ser, melhor do que uma tela quebrada.
  }

  let landed = false

  function land() {
    if (landed) return
    landed = true
    try {
      map.setTerrain(null)
    } catch {
      // Mapa já destruído entre o último quadro e este. Nada a desfazer.
    }
    onLand?.()
  }

  // `easeInOutSine`, e NÃO o `easeOutQuart` que é padrão do `animateProgress`:
  // as curvas de saída servem a interface, onde o movimento deve terminar
  // rápido e sair da frente. Aqui a pessoa está assistindo, e uma curva de saída
  // gastaria 96% do trajeto na primeira metade do tempo — a serra passaria
  // borrada e sobrariam cinco segundos de quase nada.
  const cancel = animateProgress(
    durationMs,
    (progress) => {
      applyShot(map, shotAt(progress), padding)
      if (progress >= 1) land()
    },
    easeInOutSine,
  )

  return () => {
    cancel()
    applyShot(map, LANDING, padding)
    land()
  }
}
