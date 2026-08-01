'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { GeoJSONSource, PaddingOptions } from 'maplibre-gl'
import { planRefuelStops, refuelPointsAlongRoute } from '@/domain/fuel'
import type { Coordinates } from '@/domain/geo'
import type { TripDetail } from '@/domain/trip'
import { fitPlaces } from '@/lib/map/camera'
import {
  REFUEL_LAYERS,
  REFUEL_SOURCE_ID,
  buildRefuelGeoJson,
  buildRefuelLayers,
} from '@/lib/map/refuel-layers'
import { onStyleReady } from '@/lib/map/style-lifecycle'
import {
  TRIP_ROUTE_LAYERS,
  TRIP_ROUTE_SOURCE_ID,
  buildTripRouteGeoJson,
  buildTripRouteLayers,
} from '@/lib/map/trip-route-layers'
import { useTheme } from '@/components/layout/theme-context'
import { useMapInstance } from './map-context'

interface TripRouteLayerProps {
  trip: TripDetail
  /** Espaço que o painel desta rota toma do mapa. */
  cameraPadding: PaddingOptions
  /** Autonomia da moto. `null` = o produto não marca onde o tanque acaba. */
  autonomyKm: number | null
}

export function TripRouteLayer({
  trip,
  cameraPadding,
  autonomyKm,
}: TripRouteLayerProps) {
  const map = useMapInstance()
  const { theme } = useTheme()

  const route = useMemo(() => buildTripRouteGeoJson(trip), [trip])

  /**
   * Onde o tanque acaba, sobre o traçado — a mesma conta que a seção "onde
   * abastecer" do roteiro faz no servidor.
   *
   * Repetida aqui, e não recebida por prop, porque é função pura de três
   * valores que este componente já tem. Passar o resultado do servidor pediria
   * um caminho novo por uma conta de três linhas.
   */
  const refuel = useMemo(() => {
    if (!trip.routeGeoJson || trip.distanceKm === null) return []
    const plan = planRefuelStops(trip.distanceKm, autonomyKm)
    if (!plan || plan.fitsInOneTank) return []
    return refuelPointsAlongRoute(trip.routeGeoJson.coordinates, plan)
  }, [trip, autonomyKm])

  /*
   * Os dados atuais, alcançáveis de dentro do efeito de REGISTRO.
   *
   * Sem eles, trocar de tema apagava o traçado da viagem — e o defeito era pior
   * do que o dos pins: aqui a escuta de `styledata` **se desregistrava** depois
   * do primeiro sucesso (`if (apply()) map.off(...)`), e `theme` era `ref` em
   * vez de dependência. Depois de `setStyle` não havia ninguém para recolocar a
   * rota, e ela sumia de vez, sem erro nenhum. Medido no navegador: a viagem
   * inteira desaparecia do mapa ao alternar dia/noite.
   */
  const routeRef = useRef(route)
  const refuelRef = useRef(refuel)
  useEffect(() => {
    routeRef.current = route
    refuelRef.current = refuel
  }, [route, refuel])

  /*
   * Registro das fontes e das camadas.
   *
   * `theme` é DEPENDÊNCIA, e a escuta de `styledata` fica de pé pela vida do
   * componente — os dois pontos em que este arquivo divergia do `PlacesLayer` e
   * os dois que causavam o defeito. `setStyle` derruba tudo que é nosso, e é
   * esta escuta que devolve.
   */
  useEffect(() => {
    if (!map) return

    // Idempotente por contrato: roda agora, roda a cada estilo novo, e pode
    // rodar mais de uma vez para o mesmo. Ver `onStyleReady`.
    function apply(): void {
      if (!map) return

      if (!map.getSource(TRIP_ROUTE_SOURCE_ID)) {
        // Com o traçado ATUAL, e não vazio: é esta linha que o devolve depois
        // de uma troca de tema.
        map.addSource(TRIP_ROUTE_SOURCE_ID, {
          type: 'geojson',
          data: routeRef.current,
        })
      }
      for (const layer of buildTripRouteLayers(theme)) {
        if (!map.getLayer(layer.id)) map.addLayer(layer)
      }

      if (!map.getSource(REFUEL_SOURCE_ID)) {
        map.addSource(REFUEL_SOURCE_ID, {
          type: 'geojson',
          data: buildRefuelGeoJson(refuelRef.current),
        })
      }
      // Depois do traçado, para a marca ficar POR CIMA do asfalto: ela é uma
      // interrupção da estrada, e uma interrupção desenhada por baixo não
      // interrompe nada.
      for (const layer of buildRefuelLayers(theme)) {
        if (!map.getLayer(layer.id)) map.addLayer(layer)
      }
    }

    const stop = onStyleReady(map, apply)

    return () => {
      stop()
      // O mapa pode já ter sido destruído pelo MapCanvas.
      if (!map || !map.getStyle()) return
      for (const id of [...REFUEL_LAYERS, ...TRIP_ROUTE_LAYERS]) {
        if (map.getLayer(id)) map.removeLayer(id)
      }
      if (map.getSource(REFUEL_SOURCE_ID)) map.removeSource(REFUEL_SOURCE_ID)
      if (map.getSource(TRIP_ROUTE_SOURCE_ID)) {
        map.removeSource(TRIP_ROUTE_SOURCE_ID)
      }
    }
  }, [map, theme])

  // Dados. Separado do registro para que trocar de viagem não destrua e recrie
  // as camadas — e para que trocar de tema não precise conhecer a viagem.
  useEffect(() => {
    if (!map) return

    const routeSource = map.getSource(TRIP_ROUTE_SOURCE_ID) as
      | GeoJSONSource
      | undefined
    routeSource?.setData(route)

    const refuelSource = map.getSource(REFUEL_SOURCE_ID) as
      | GeoJSONSource
      | undefined
    refuelSource?.setData(buildRefuelGeoJson(refuel))
  }, [map, route, refuel])

  /*
   * Câmera, e só quando a VIAGEM muda.
   *
   * Sem isto a rota nasce fora do enquadramento: o mapa sobrevive à navegação
   * (ADR 0002), então ele chega aqui olhando para onde o usuário estava, e não
   * para a viagem que ele acabou de abrir.
   *
   * Fora do efeito de registro de propósito: lá dentro, trocar de tema
   * reenquadraria o mapa e arrancaria da pessoa a posição que ela tinha
   * escolhido — um efeito colateral que nada no gesto "mudar para o tema claro"
   * pede.
   */
  useEffect(() => {
    if (!map) return
    const targets: Coordinates[] = [
      ...(trip.originCoordinates ? [trip.originCoordinates] : []),
      ...trip.stops.map((stop) => stop.coordinates),
    ]
    if (targets.length > 0) fitPlaces(map, targets, cameraPadding)
  }, [map, trip, cameraPadding])

  return null
}
