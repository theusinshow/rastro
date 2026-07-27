'use client'

import { useEffect, useRef } from 'react'
// O maplibre-gl 6 não expõe mais um default export: a classe do mapa vem
// nomeada, e a renomeamos para não colidir com o `Map` nativo do JavaScript.
import { Map as MapLibreMap, setWorkerUrl } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  INITIAL_CENTER,
  INITIAL_ZOOM,
  MAPTILER_KEY,
  hasMapTilerKey,
} from '@/lib/map/config'
import { buildRastroStyle } from '@/lib/map/style'
import { MapFallback } from './MapFallback'
import { useMapRegistry } from './map-context'

/**
 * O maplibre-gl 6 carrega o worker como um arquivo irmão resolvido a partir de
 * `import.meta.url`. Sob o Turbopack esse arquivo não existe — o módulo vira um
 * chunk hasheado — e o worker morre calado, deixando o mapa preto. Servimos a
 * cópia de `public/maplibre/` (ver `scripts/copy-maplibre-worker.mjs`).
 */
const WORKER_URL = '/maplibre/maplibre-gl-worker.mjs'

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { registerMap, updateView } = useMapRegistry()

  useEffect(() => {
    if (!hasMapTilerKey) return
    const container = containerRef.current
    if (!container) return

    setWorkerUrl(WORKER_URL)

    const map = new MapLibreMap({
      container,
      style: buildRastroStyle(MAPTILER_KEY),
      center: [INITIAL_CENTER.longitude, INITIAL_CENTER.latitude],
      zoom: INITIAL_ZOOM,
      attributionControl: { compact: true },
      // Sem rotação: o norte fixo é convenção cartográfica e evita
      // desorientação em uso rápido, que é o caso durante uma viagem.
      dragRotate: false,
      pitchWithRotate: false,
    })

    map.touchZoomRotate.disableRotation()

    function publishView() {
      const center = map.getCenter()
      updateView({
        center: { latitude: center.lat, longitude: center.lng },
        zoom: map.getZoom(),
      })
    }

    map.on('load', () => {
      publishView()
      registerMap(map)
    })
    map.on('move', publishView)

    return () => {
      registerMap(null)
      map.remove()
    }
  }, [registerMap, updateView])

  if (!hasMapTilerKey) {
    return <MapFallback />
  }

  // O posicionamento vive no wrapper, não no contêiner do mapa: o CSS do
  // maplibre-gl aplica `position: relative` em `.maplibregl-map` e, por vir
  // depois das utilitárias do Tailwind na ordem da folha, venceria um
  // `absolute` aplicado direto no contêiner — colapsando a altura para zero.
  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  )
}
