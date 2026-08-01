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

/**
 * O ritmo dentro do aplicativo é mais rápido, e a razão é o que há para ler.
 *
 * Na entrada, a parada existe para dar tempo de ler o painel — nome, categoria e
 * a linha escrita à mão sobre o lugar. Dentro do app não há painel acompanhando:
 * o que o passeio mostra é a geografia e o pin em foco, e segurar 3,5 segundos
 * sobre isso vira espera. Aqui ele é ambiente, não é leitura.
 */
export const EXPLORE_FLY_MS = 2_600
export const EXPLORE_HOLD_MS = 1_900

/**
 * Como a câmera se comporta num passeio. Dois perfis, e a diferença não é de
 * gosto — é de **o que o mapa está sendo naquela tela**.
 */
export interface TourCamera {
  zoom: number
  pitch: number
  /**
   * Ângulos de aproximação, em rodízio.
   *
   * Chegar sempre pelo mesmo lado faz lugares diferentes parecerem o mesmo
   * lugar. São **determinísticos** de propósito: `Math.random()` faria o
   * passeio ser irreprodutível entre execuções, e este código roda também no
   * ambiente de teste.
   */
  bearings: readonly number[]
  /** Exagero do relevo. `null` não liga o terreno 3D. */
  terrainExaggeration: number | null
}

/**
 * CENÁRIO — a tela de entrada.
 *
 * Ali o mapa não é instrumento: ele é o produto se apresentando a quem ainda não
 * entrou. Inclinar, girar e levantar as serras é o trabalho dele. Ver ADR 0018.
 */
export const TOUR_SCENERY: TourCamera = {
  zoom: 11.2,
  pitch: 55,
  bearings: [-32, 18, -12, 40],
  terrainExaggeration: 1.4,
}

/**
 * INSTRUMENTO — dentro do aplicativo.
 *
 * Plano, ao norte, sem relevo 3D. Três razões, e nenhuma é estética:
 *
 * 1. **O norte é fixo por decisão de cartografia.** `MapCanvas` desliga a
 *    rotação para o usuário e `setMapInteractive` a mantém desligada nos dois
 *    estados. Um passeio que gira deixaria o mapa torto no instante em que a
 *    pessoa tocasse nele — e ela não teria como endireitar, porque a rotação
 *    está desligada justamente para ela.
 * 2. **Não há o que desfazer ao parar.** O passeio termina no primeiro gesto, e
 *    devolver `pitch` e `bearing` ao zero enquanto alguém já está arrastando
 *    seria a câmera brigando com a mão.
 * 3. **Zoom mais aberto** (10,2 contra 11,2): aqui o passeio apresenta o
 *    catálogo, e não um lugar de cada vez. De 10,2 os vizinhos aparecem, e o
 *    olho entende que há mais coisa em volta.
 */
export const TOUR_INSTRUMENT: TourCamera = {
  zoom: 10.2,
  pitch: 0,
  bearings: [0],
  terrainExaggeration: null,
}

/**
 * A câmera para o enésimo lugar do passeio.
 *
 * Pura e exportada porque é o miolo testável: o resto do módulo é efeito
 * colateral sobre o MapLibre, que teste de unidade não alcança.
 */
export function tourShotFor(
  stop: TourStop,
  index: number,
  camera: TourCamera = TOUR_SCENERY,
) {
  return {
    center: [stop.longitude, stop.latitude] as [number, number],
    zoom: camera.zoom,
    pitch: camera.pitch,
    bearing: camera.bearings[index % camera.bearings.length]!,
  }
}

interface TourOptions {
  padding?: PaddingOptions
  /** Avisa qual lugar está em foco, para o painel acompanhar. */
  onStopChange?: (index: number) => void
  /** Padrão: o perfil de cenário, que é o da tela de entrada. */
  camera?: TourCamera
  /** Tempo de voo entre dois lugares. Padrão: `FLY_MS`. */
  flyMs?: number
  /** Tempo parado sobre um lugar. Padrão: `HOLD_MS`. */
  holdMs?: number
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
  {
    padding,
    onStopChange,
    camera = TOUR_SCENERY,
    flyMs = FLY_MS,
    holdMs = HOLD_MS,
  }: TourOptions = {},
): () => void {
  if (stops.length === 0) return () => {}

  if (camera.terrainExaggeration !== null) {
    try {
      map.setTerrain({
        source: 'terrain',
        exaggeration: camera.terrainExaggeration,
      })
    } catch {
      // Estilo sem fonte de relevo, ou WebGL sem folga. O passeio segue em 2D.
    }
  }

  let cancelled = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let index = 0

  function visit() {
    if (cancelled) return

    const stop = stops[index % stops.length]!
    const shot = tourShotFor(stop, index, camera)
    onStopChange?.(index % stops.length)

    map.flyTo({
      ...shot,
      duration: flyMs,
      easing: easeInOutSine,
      ...(padding ? { padding: usable(map, padding) } : {}),
    })

    index += 1
    timer = setTimeout(visit, flyMs + holdMs)
  }

  visit()

  return () => {
    cancelled = true
    if (timer) clearTimeout(timer)
    map.stop()

    // Só desfaz o que ESTE passeio fez. Zerar o terreno de um passeio que nunca
    // o ligou apagaria o relevo de quem quer que o tenha ligado antes.
    if (camera.terrainExaggeration === null) return
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
