'use client'

import { useEffect } from 'react'
import type { PaddingOptions } from 'maplibre-gl'
import type { Coordinates } from '@/domain/geo'
import type { TripDetail } from '@/domain/trip'
import { fitPlaces } from '@/lib/map/camera'
import {
  TRIP_ROUTE_LAYERS,
  TRIP_ROUTE_SOURCE_ID,
  buildTripRouteGeoJson,
  buildTripRouteLayers,
} from '@/lib/map/trip-route-layers'
import { useMapInstance } from './map-context'

interface TripRouteLayerProps {
  trip: TripDetail
  /** Espaço que o painel desta rota toma do mapa. */
  cameraPadding: PaddingOptions
}

export function TripRouteLayer({ trip, cameraPadding }: TripRouteLayerProps) {
  const map = useMapInstance()

  useEffect(() => {
    if (!map) return

    const data = buildTripRouteGeoJson(trip)

    function apply(): boolean {
      // O estilo precisa estar carregado: `addLayer` antes disso é descartado, e
      // o MapLibre não avisa — foi assim que 14 pins ficaram invisíveis neste
      // repositório com lint, typecheck e testes limpos.
      if (!map || !map.isStyleLoaded()) return false

      if (!map.getSource(TRIP_ROUTE_SOURCE_ID)) {
        map.addSource(TRIP_ROUTE_SOURCE_ID, { type: 'geojson', data })
        for (const layer of buildTripRouteLayers()) {
          map.addLayer(layer)
        }
      }

      // Sem isto a rota nasce fora do enquadramento: o mapa sobrevive à navegação
      // (ADR 0002), então ele chega aqui olhando para onde o usuário estava, e
      // não para a viagem que ele acabou de abrir.
      const targets: Coordinates[] = [
        ...(trip.originCoordinates ? [trip.originCoordinates] : []),
        ...trip.stops.map((stop) => stop.coordinates),
      ]
      if (targets.length > 0) fitPlaces(map, targets, cameraPadding)

      return true
    }

    if (apply()) return cleanup

    /*
     * `styledata`, e NÃO `once('load')`.
     *
     * `load` dispara uma vez na vida da instância. Ao salvar uma viagem, o
     * `revalidatePath` remonta o layout e o mapa; nesse intervalo
     * `isStyleLoaded()` volta a ser falso, mas o `load` daquela instância já
     * passou — e um `once('load')` registrado aqui nunca é chamado. O traçado
     * simplesmente não aparecia, sem erro em lugar nenhum.
     *
     * `styledata` dispara a cada carga de dados de estilo, inclusive depois do
     * `load`, então serve tanto para a carga completa quanto para a navegação
     * pelo cliente.
     */
    function onStyleData() {
      if (apply()) map?.off('styledata', onStyleData)
    }

    map.on('styledata', onStyleData)

    function cleanup() {
      if (!map) return
      map.off('styledata', onStyleData)
      for (const id of TRIP_ROUTE_LAYERS) {
        if (map.getLayer(id)) map.removeLayer(id)
      }
      if (map.getSource(TRIP_ROUTE_SOURCE_ID)) {
        map.removeSource(TRIP_ROUTE_SOURCE_ID)
      }
    }

    return cleanup
  }, [map, trip, cameraPadding])

  return null
}
