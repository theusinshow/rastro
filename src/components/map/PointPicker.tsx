'use client'

import { useEffect } from 'react'
import type { MapMouseEvent } from 'maplibre-gl'
import type { Coordinates } from '@/domain/geo'
import { useMapInstance } from './map-context'
import { usePickerControls } from './picker-context'

/**
 * Põe o mapa em modo de mira: o cursor vira cruz, a coordenada sob ele é
 * publicada na StatusBar, e o clique devolve o ponto.
 *
 * Não desenha nada — o retorno é `null`, como `PlacesLayer`. Quem manda no mapa
 * são efeitos, não JSX.
 *
 * `onPick` precisa ter identidade estável entre renders (`useCallback` no
 * consumidor), ou o efeito remonta a cada quadro e o modo de mira pisca. Mesmo
 * contrato que `useExitTransition` documenta.
 */
export function PointPicker({
  onPick,
}: {
  onPick: (point: Coordinates) => void
}): null {
  const map = useMapInstance()
  const { setActive, setCursor } = usePickerControls()

  useEffect(() => {
    if (!map) return

    setActive(true)
    const canvas = map.getCanvas()
    const previousCursor = canvas.style.cursor
    canvas.style.cursor = 'crosshair'

    function handleMove(event: MapMouseEvent) {
      setCursor({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })
    }

    function handleClick(event: MapMouseEvent) {
      onPick({ latitude: event.lngLat.lat, longitude: event.lngLat.lng })
    }

    map.on('mousemove', handleMove)
    map.on('click', handleClick)

    return () => {
      map.off('mousemove', handleMove)
      map.off('click', handleClick)
      canvas.style.cursor = previousCursor
      setActive(false)
      setCursor(null)
    }
  }, [map, onPick, setActive, setCursor])

  return null
}
