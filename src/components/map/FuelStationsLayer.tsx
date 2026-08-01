'use client'

import { useEffect, useRef } from 'react'
import type { GeoJSONSource, MapLayerMouseEvent } from 'maplibre-gl'
import type { FuelStation } from '@/domain/fuel-stations'
import {
  FUEL_ICONS,
  FUEL_LAYERS,
  FUEL_SOURCE_ID,
  ICON_PIXEL_RATIO,
  buildFuelIcons,
  buildFuelLayers,
  buildFuelStationsGeoJson,
} from '@/lib/map/fuel-layers'
import { onStyleReady } from '@/lib/map/style-lifecycle'
import { useTheme } from '@/components/layout/theme-context'
import { useMapInstance } from './map-context'

interface FuelStationsLayerProps {
  stations: FuelStation[]
  selectedId: string | null
  onSelect: (id: string) => void
}

/**
 * Os postos no mapa. Renderiza `null` — o padrão "componente sem DOM".
 *
 * Mesmo desenho de `PlacesLayer`, e as mesmas duas armadilhas já pagas lá:
 *
 * - **`styledata`**, e não `load`. Trocar de tema chama `setStyle`, que derruba
 *   TODAS as camadas nossas junto — e, aqui, as imagens registradas também.
 *   Sem esta escuta, alternar dia/noite apagaria os postos sem erro nenhum no
 *   console.
 * - **A limpeza checa `map.getStyle()`** antes de remover: o `MapCanvas` pode já
 *   ter chamado `map.remove()` antes de o efeito de limpeza rodar, cenário comum
 *   no StrictMode, que monta e desmonta efeitos duas vezes.
 *
 * O que ele NÃO faz, de propósito: buscar. Quem decide quando consultar o
 * provedor é a interface, por ação explícita — mover o mapa não dispara rede
 * nenhuma a partir daqui.
 */
export function FuelStationsLayer({
  stations,
  selectedId,
  onSelect,
}: FuelStationsLayerProps): null {
  const map = useMapInstance()
  const { theme } = useTheme()

  /*
   * Os postos atuais, alcançáveis de dentro do efeito de registro.
   *
   * Mesmo defeito que o `PlacesLayer` tinha: a escuta de `styledata` recoloca a
   * fonte ao trocar de tema, mas a recolocaria **vazia** — o efeito de dados
   * depende de `[map, stations, selectedId]`, e nenhum dos três muda quando o
   * tema muda. Os losangos sumiriam do mapa com a lista ainda cheia ao lado.
   */
  const stationsRef = useRef(stations)
  const selectedRef = useRef(selectedId)
  useEffect(() => {
    stationsRef.current = stations
    selectedRef.current = selectedId
  }, [stations, selectedId])

  // Registro das imagens, da fonte e das camadas. `theme` é dependência, e não
  // `ref`: as imagens do losango carregam a paleta dentro dos pixels, então
  // trocar de tema exige refazê-las, não só recolocá-las.
  useEffect(() => {
    if (!map) return

    // Idempotente por contrato. Ver `onStyleReady`.
    function apply(): void {
      if (!map) return

      for (const { id, icon } of buildFuelIcons(theme)) {
        // `setStyle` limpa o registro de imagens junto com as camadas, então a
        // pergunta precisa ser feita a cada passada — não só na montagem.
        if (map.hasImage(id)) map.removeImage(id)
        map.addImage(id, icon, { pixelRatio: ICON_PIXEL_RATIO })
      }

      if (!map.getSource(FUEL_SOURCE_ID)) {
        // Com os postos ATUAIS, e nao vazia: e esta linha que os devolve
        // depois de uma troca de tema.
        map.addSource(FUEL_SOURCE_ID, {
          type: 'geojson',
          data: buildFuelStationsGeoJson(stationsRef.current, selectedRef.current),
        })
      }
      for (const layer of buildFuelLayers(theme)) {
        if (!map.getLayer(layer.id)) map.addLayer(layer)
      }
    }

    const stop = onStyleReady(map, apply)

    return () => {
      stop()
      // O mapa pode já ter sido destruído pelo MapCanvas.
      if (!map || !map.getStyle()) return
      for (const id of Object.values(FUEL_LAYERS)) {
        if (map.getLayer(id)) map.removeLayer(id)
      }
      if (map.getSource(FUEL_SOURCE_ID)) map.removeSource(FUEL_SOURCE_ID)
      for (const id of Object.values(FUEL_ICONS)) {
        if (map.hasImage(id)) map.removeImage(id)
      }
    }
  }, [map, theme])

  // Dados. Sem crossfade, ao contrário do catálogo: lá o recorte muda a cada
  // filtro e a mudança precisa ser legível; aqui a lista só troca quando alguém
  // pede uma busca nova, e o gesto já explica a troca.
  useEffect(() => {
    if (!map) return
    const source = map.getSource(FUEL_SOURCE_ID) as GeoJSONSource | undefined
    if (!source) return
    source.setData(buildFuelStationsGeoJson(stations, selectedId))
  }, [map, stations, selectedId])

  // Interação. Não há tratamento de clique no vazio: limpar a seleção de posto
  // é papel do painel, que tem um botão para isso — e roubar o clique de fundo
  // brigaria com o do catálogo, que já mora no `PlacesLayer`.
  useEffect(() => {
    if (!map) return

    function handleClick(event: MapLayerMouseEvent) {
      const id = event.features?.[0]?.properties?.id
      if (typeof id === 'string') onSelect(id)
    }

    function enter() {
      map!.getCanvas().style.cursor = 'pointer'
    }
    function leave() {
      map!.getCanvas().style.cursor = ''
    }

    map.on('click', FUEL_LAYERS.marker, handleClick)
    map.on('mouseenter', FUEL_LAYERS.marker, enter)
    map.on('mouseleave', FUEL_LAYERS.marker, leave)

    return () => {
      map.off('click', FUEL_LAYERS.marker, handleClick)
      map.off('mouseenter', FUEL_LAYERS.marker, enter)
      map.off('mouseleave', FUEL_LAYERS.marker, leave)
    }
  }, [map, onSelect])

  return null
}
