'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { consumeArrival } from '@/lib/map/arrival'
import { INITIAL_CENTER, INITIAL_ZOOM } from '@/lib/map/config'
import { setMapInteractive } from '@/lib/map/interactivity'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { useMapInstance } from './map-context'

/** Onde o mapa é cenário, e não instrumento. */
const SCENERY_PATHS = ['/entrar']

/**
 * Quanto dura a viagem da serra até o enquadramento do app.
 *
 * Maior que os tempos de `camera.ts` de propósito: aqueles respondem a um
 * clique, e o olho já sabe para onde vai. Este é a continuação de um sobrevoo
 * que a pessoa estava assistindo, e cortar seco aqui desfaria justamente o que
 * mover o mapa para a raiz existe para conseguir.
 */
const ARRIVAL_MS = 2200

/**
 * Ajusta o mapa do layout raiz à rota em que ele está.
 *
 * Duas responsabilidades, e as duas nasceram da mesma mudança (ADR 0018):
 * o mapa não é mais montado por quem sabia o que queria dele, então alguém
 * precisa dizer, a cada rota, se ele é cenário ou instrumento — e alguém
 * precisa notar a chegada no app para continuar a câmera de onde o sobrevoo
 * parou.
 */
export function MapChrome() {
  const map = useMapInstance()
  const pathname = usePathname()
  const reducedMotion = useReducedMotion()

  const isScenery = SCENERY_PATHS.some((path) => pathname.startsWith(path))

  useEffect(() => {
    if (!map) return
    setMapInteractive(map, !isScenery)
  }, [map, isScenery])

  useEffect(() => {
    if (!map || isScenery) return
    if (!consumeArrival()) return

    map.easeTo({
      center: [INITIAL_CENTER.longitude, INITIAL_CENTER.latitude],
      zoom: INITIAL_ZOOM,
      pitch: 0,
      bearing: 0,
      // Zero corta seco, que é o que a preferência pede — e o sobrevoo já foi
      // pulado antes, então não há continuidade a preservar.
      duration: reducedMotion ? 0 : ARRIVAL_MS,
    })
  }, [map, isScenery, reducedMotion])

  return null
}
