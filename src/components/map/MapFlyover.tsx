'use client'

import { useEffect } from 'react'
import type { PaddingOptions } from 'maplibre-gl'
import { markArrival } from '@/lib/map/arrival'
import { landImmediately, runFlyover } from '@/lib/map/flyover'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { useMapInstance } from './map-context'

/**
 * Largura do painel da entrada no desktop (`md:w-104` = 26rem).
 *
 * Vira padding de câmera para a serra não terminar embaixo do painel. O
 * `usable()` de `camera.ts` descarta o padding quando ele não cabe, que é
 * exatamente o caso do celular — lá o painel toma a tela inteira e não há mapa
 * visível para enquadrar.
 */
const PANEL_PADDING: PaddingOptions = { left: 416, top: 0, right: 0, bottom: 0 }

/**
 * O sobrevoo da tela de entrada.
 *
 * Não desenha nada: existe só para dirigir a câmera do mapa que já está no
 * layout raiz. Fica montado enquanto a entrada estiver na tela, e ao sair —
 * porque a pessoa entrou — a limpeza pousa a câmera na hora, o que impede um
 * sobrevoo pela metade de continuar rodando por cima do app.
 */
export function MapFlyover() {
  const map = useMapInstance()
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!map) return

    if (reducedMotion) {
      landImmediately(map, PANEL_PADDING)
      markArrival()
      return
    }

    return runFlyover(map, { padding: PANEL_PADDING, onLand: markArrival })
  }, [map, reducedMotion])

  return null
}
