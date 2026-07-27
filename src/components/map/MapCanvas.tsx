'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  INITIAL_CENTER,
  INITIAL_ZOOM,
  MAPTILER_KEY,
  hasMapTilerKey,
} from '@/lib/map/config'
import { buildRastroStyle } from '@/lib/map/style'
import { MapFallback, MapLoadError } from './MapFallback'
import { useMapRegistry } from './map-context'

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { registerMap, updateView } = useMapRegistry()
  const [loadFailure, setLoadFailure] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!hasMapTilerKey) return
    const container = containerRef.current
    if (!container) return

    const map = new maplibregl.Map({
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

    let loaded = false

    function publishView() {
      const center = map.getCenter()
      updateView({
        center: { latitude: center.lat, longitude: center.lng },
        zoom: map.getZoom(),
      })
    }

    map.on('load', () => {
      loaded = true
      publishView()
      registerMap(map)
      setLoaded(true)
    })
    map.on('move', publishView)

    // Erro depois do `load` é transitório — um tile que não veio, um glyph que
    // faltou — e o mapa segue utilizável. Antes do `load` é fatal: estilo,
    // fonte ou chave inválidos deixariam uma tela preta com o console limpo,
    // que é exatamente o resultado que o estado de fallback existe para evitar.
    map.on('error', (event) => {
      if (loaded) return
      setLoadFailure(event.error.message)
    })

    return () => {
      registerMap(null)
      setLoaded(false)
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
  //
  // O aviso de falha cobre o contêiner em vez de substituí-lo: desmontar o nó
  // que o MapLibre já adotou atrapalharia a limpeza do efeito.
  // O fade de primeira pintura mora num nó só nosso: aplicá-lo no contêiner que
  // o MapLibre adota misturaria nossas classes com as dele.
  return (
    <div className="absolute inset-0">
      <div className="map-surface h-full w-full" data-loaded={loaded}>
        <div ref={containerRef} className="h-full w-full" />
      </div>
      {loadFailure === null ? null : <MapLoadError detail={loadFailure} />}
    </div>
  )
}
