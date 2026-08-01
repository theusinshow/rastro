'use client'

import { useEffect } from 'react'
import type { PaddingOptions } from 'maplibre-gl'
import type { ExplorePlace } from '@/domain/place'
import { consumeArrival } from '@/lib/map/arrival'
import {
  dismissExploreTour,
  isExploreTourDismissed,
} from '@/lib/map/explore-tour'
import {
  EXPLORE_FLY_MS,
  EXPLORE_HOLD_MS,
  TOUR_INSTRUMENT,
  runTour,
} from '@/lib/map/tour'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { useMapInstance } from './map-context'

/**
 * Os gestos que dizem "o mapa é meu agora".
 *
 * Escutados na `window` com captura, e não no canvas do mapa: mexer na trilha de
 * filtros à esquerda também precisa parar a câmera. Um passeio que continua
 * voando enquanto alguém lê uma lista é exatamente o tipo de movimento que
 * atrapalha em vez de convidar.
 */
const GESTURES = ['pointerdown', 'wheel', 'keydown', 'touchstart'] as const

interface ExploreTourProps {
  /** Os lugares a visitar, na ordem. Precisa ter identidade estável. */
  places: ExplorePlace[]
  /** O passeio pode rodar agora. Falso com um lugar já selecionado na URL. */
  active: boolean
  /** Espaço que os painéis desta rota tomam do mapa. */
  cameraPadding: PaddingOptions
  /** Qual lugar está sob a câmera. Vira o anel de realce do pin. */
  onFocus: (slug: string | null) => void
}

/**
 * O passeio pelos lugares dentro do aplicativo. Renderiza `null`.
 *
 * O mesmo movimento da tela de entrada, com **duas diferenças que não são
 * detalhe**:
 *
 * 1. **A câmera é de instrumento** — plana, ao norte, sem relevo 3D. O norte é
 *    fixo por decisão de cartografia e a rotação está desligada para o usuário;
 *    um passeio que inclinasse e girasse deixaria o mapa torto no instante em
 *    que a pessoa tocasse nele, sem como endireitar. Ver `TOUR_INSTRUMENT`.
 * 2. **Ele termina no primeiro gesto**, e não volta. O mapa aqui é ferramenta,
 *    e uma ferramenta que se mexe sozinha enquanto você a usa não é
 *    apresentação — é defeito.
 *
 * Não desenha nada e não decide o que mostrar: quem escolhe os lugares é quem
 * monta a rota. O realce do pin em foco reaproveita o mesmo `hoveredSlug` que
 * costura a lista ao mapa — nenhum vocabulário visual novo entra por causa
 * disto.
 */
export function ExploreTour({
  places,
  active,
  cameraPadding,
  onFocus,
}: ExploreTourProps): null {
  const map = useMapInstance()
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!map || !active || reducedMotion) return
    if (places.length === 0) return
    // Já houve gesto nesta sessão. O mapa é da pessoa.
    if (isExploreTourDismissed()) return

    /*
     * Consome o bilhete do sobrevoo da entrada.
     *
     * Sem isto, `MapChrome` também acharia que acabou de chegar e faria a
     * câmera voltar ao enquadramento do estado — as duas disputariam o mesmo
     * mapa, e o resultado seria o passeio pulando a primeira parada. Efeitos de
     * página rodam antes dos do layout, então este chega primeiro ao bilhete.
     *
     * Quem chegou do sobrevoo já tem um movimento planejado: este.
     */
    consumeArrival()

    const stopTour = runTour(map, places, {
      camera: TOUR_INSTRUMENT,
      padding: cameraPadding,
      flyMs: EXPLORE_FLY_MS,
      holdMs: EXPLORE_HOLD_MS,
      onStopChange: (index) => onFocus(places[index]?.slug ?? null),
    })

    function unlisten() {
      for (const gesture of GESTURES) {
        window.removeEventListener(gesture, dismiss, { capture: true })
      }
    }

    function dismiss() {
      dismissExploreTour()
      stopTour()
      onFocus(null)
      unlisten()
    }

    for (const gesture of GESTURES) {
      // `capture`: pega o gesto na descida, antes de qualquer componente parar a
      // propagação. `passive`: nada aqui cancela o gesto — só observa.
      window.addEventListener(gesture, dismiss, {
        capture: true,
        passive: true,
        once: true,
      })
    }

    return () => {
      stopTour()
      onFocus(null)
      unlisten()
    }
  }, [map, active, reducedMotion, places, cameraPadding, onFocus])

  return null
}
