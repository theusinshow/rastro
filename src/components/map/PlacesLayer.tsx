'use client'

import { useEffect } from 'react'
import type { GeoJSONSource, MapLayerMouseEvent, MapMouseEvent } from 'maplibre-gl'
import type { ExplorePlace } from '@/domain/place'
import {
  PLACES_SOURCE_ID,
  PLACE_LAYERS,
  buildPlaceLayers,
  buildPlacesGeoJson,
} from '@/lib/map/layers'
import { useSelectedPlace } from '@/components/explore/use-selected-place'
import { useMapInstance } from './map-context'

interface PlacesLayerProps {
  places: ExplorePlace[]
}

export function PlacesLayer({ places }: PlacesLayerProps) {
  const map = useMapInstance()
  const { slug, select } = useSelectedPlace()

  // Registro da fonte e das camadas. Roda uma vez por instância de mapa.
  useEffect(() => {
    if (!map) return

    if (!map.getSource(PLACES_SOURCE_ID)) {
      map.addSource(PLACES_SOURCE_ID, {
        type: 'geojson',
        data: buildPlacesGeoJson([]),
      })
      for (const layer of buildPlaceLayers()) {
        map.addLayer(layer)
      }
    }

    return () => {
      // O mapa pode já ter sido destruído pelo MapCanvas.
      if (!map.getStyle()) return
      for (const id of Object.values(PLACE_LAYERS)) {
        if (map.getLayer(id)) map.removeLayer(id)
      }
      if (map.getSource(PLACES_SOURCE_ID)) map.removeSource(PLACES_SOURCE_ID)
    }
  }, [map])

  // Dados. Roda sempre que a lista filtrada muda.
  useEffect(() => {
    if (!map) return
    const source = map.getSource(PLACES_SOURCE_ID) as GeoJSONSource | undefined
    source?.setData(buildPlacesGeoJson(places))
  }, [map, places])

  // Realce da seleção.
  useEffect(() => {
    if (!map || !map.getLayer(PLACE_LAYERS.selected)) return
    map.setFilter(PLACE_LAYERS.selected, [
      '==',
      ['get', 'slug'],
      slug ?? '__none__',
    ])
  }, [map, slug])

  // Interação: clique seleciona, clique no vazio limpa, cursor vira ponteiro.
  useEffect(() => {
    if (!map) return

    function handlePlaceClick(event: MapLayerMouseEvent) {
      const feature = event.features?.[0]
      const clicked = feature?.properties?.slug
      if (typeof clicked === 'string') {
        select(clicked)
      }
    }

    function handleBackgroundClick(event: MapMouseEvent) {
      const hits = map!.queryRenderedFeatures(event.point, {
        layers: [PLACE_LAYERS.core],
      })
      if (hits.length === 0) select(null)
    }

    function enter() {
      map!.getCanvas().style.cursor = 'pointer'
    }
    function leave() {
      map!.getCanvas().style.cursor = ''
    }

    map.on('click', PLACE_LAYERS.core, handlePlaceClick)
    map.on('click', handleBackgroundClick)
    map.on('mouseenter', PLACE_LAYERS.core, enter)
    map.on('mouseleave', PLACE_LAYERS.core, leave)

    return () => {
      map.off('click', PLACE_LAYERS.core, handlePlaceClick)
      map.off('click', handleBackgroundClick)
      map.off('mouseenter', PLACE_LAYERS.core, enter)
      map.off('mouseleave', PLACE_LAYERS.core, leave)
    }
  }, [map, select])

  return null
}
