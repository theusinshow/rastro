'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { Coordinates } from '@/domain/geo'

export interface MapView {
  center: Coordinates
  zoom: number
}

interface MapContextValue {
  map: MapLibreMap | null
  view: MapView | null
  registerMap: (map: MapLibreMap | null) => void
  updateView: (view: MapView) => void
}

const MapContext = createContext<MapContextValue | null>(null)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [view, setView] = useState<MapView | null>(null)

  const value = useMemo<MapContextValue>(
    () => ({ map, view, registerMap: setMap, updateView: setView }),
    [map, view],
  )

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}

function useMapContext(): MapContextValue {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMapContext precisa estar dentro de <MapProvider>')
  }
  return context
}

/** Instância do MapLibre. `null` até o mapa terminar de carregar. */
export function useMapInstance(): MapLibreMap | null {
  return useMapContext().map
}

/** Centro e zoom atuais. `null` antes do primeiro movimento. */
export function useMapView(): MapView | null {
  return useMapContext().view
}

/** Uso exclusivo do MapCanvas. */
export function useMapRegistry() {
  const { registerMap, updateView } = useMapContext()
  return { registerMap, updateView }
}
