'use client'

import { useEffect, useMemo, useRef } from 'react'
import type {
  GeoJSONSource,
  MapLayerMouseEvent,
  MapMouseEvent,
  MapSourceDataEvent,
  PaddingOptions,
} from 'maplibre-gl'
import type { ExplorePlace } from '@/domain/place'
import { focusPlace } from '@/lib/map/camera'
import {
  PLACES_SOURCE_ID,
  PLACE_LAYERS,
  buildPlaceLayers,
  buildPlacesGeoJson,
} from '@/lib/map/layers'
import {
  HOVER_GROW_MS,
  MATCH_FADE_MS,
  SELECTION_GROW_MS,
  applyHoverRing,
  applyMatchFade,
  applySelectionRing,
} from '@/lib/map/paint'
import { animateProgress } from '@/lib/motion/animate-progress'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { useSelectedPlace } from '@/components/explore/use-selected-place'
import { useTheme } from '@/components/layout/theme-context'
import { useMapInstance } from './map-context'

const NO_MATCH = '__none__'

/** Prazo máximo de espera pela análise do GeoJSON antes de animar assim mesmo. */
const DATA_SETTLE_TIMEOUT_MS = 400

interface PlacesLayerProps {
  /** Todos os lugares, inclusive os que o recorte atual exclui. */
  places: ExplorePlace[]
  /** O recorte atual. Decidido no domínio, nunca aqui. */
  visible: ExplorePlace[]
  /** Lugar sob o cursor numa lista da interface. */
  hoveredSlug?: string | null
  /** Espaço que os painéis desta rota tomam do mapa. */
  cameraPadding: PaddingOptions
}

export function PlacesLayer({
  places,
  visible,
  hoveredSlug = null,
  cameraPadding,
}: PlacesLayerProps) {
  const map = useMapInstance()
  const { slug, select } = useSelectedPlace()
  const reducedMotion = useReducedMotion()
  const { theme } = useTheme()

  const matched = useMemo(
    () => new Set(visible.map((place) => place.slug)),
    [visible],
  )

  // De onde veio a seleção: clique em pin reposiciona, clique em lista
  // aproxima. Ver `focusPlace`.
  const fromPinRef = useRef(false)
  const fadeRef = useRef<{
    from: ReadonlySet<string>
    to: ReadonlySet<string>
  } | null>(null)

  /*
   * Registro da fonte e das camadas.
   *
   * Escuta `styledata` pelo mesmo motivo que o traçado da viagem: trocar de tema
   * chama `setStyle`, e `setStyle` derruba TODAS as camadas nossas junto. Sem
   * esta escuta, alternar dia/noite apagava os catorze pins do mapa e não havia
   * erro em lugar nenhum — o mesmo modo de falha silenciosa que já apareceu
   * neste arquivo antes.
   *
   * `theme` é dependência aqui, e não `ref`: as camadas precisam ser
   * reconstruídas com a paleta nova, não só recolocadas.
   */
  useEffect(() => {
    if (!map) return

    function apply(): boolean {
      if (!map || !map.isStyleLoaded()) return false
      if (map.getSource(PLACES_SOURCE_ID)) return true

      map.addSource(PLACES_SOURCE_ID, {
        type: 'geojson',
        data: buildPlacesGeoJson([], new Set()),
      })
      for (const layer of buildPlaceLayers(theme)) {
        map.addLayer(layer)
      }
      return true
    }

    function cleanup() {
      // O mapa pode já ter sido destruído pelo MapCanvas.
      if (!map || !map.getStyle()) return
      map.off('styledata', onStyleData)
      for (const id of Object.values(PLACE_LAYERS)) {
        if (map.getLayer(id)) map.removeLayer(id)
      }
      if (map.getSource(PLACES_SOURCE_ID)) map.removeSource(PLACES_SOURCE_ID)
    }

    function onStyleData() {
      apply()
    }

    apply()
    map.on('styledata', onStyleData)

    return cleanup
  }, [map, theme])

  // Dados e crossfade do recorte. Sem o crossfade, marcar um filtro faz treze
  // dos catorze pins sumirem num quadro e o tamanho da mudança fica ilegível.
  //
  // Este é um dos dois movimentos que sobrevivem a `prefers-reduced-motion`:
  // é a única evidência de que o recorte mudou, e opacidade sem deslocamento é
  // segura para gatilho vestibular.
  useEffect(() => {
    if (!map) return
    const source = map.getSource(PLACES_SOURCE_ID) as GeoJSONSource | undefined
    if (!source) return

    // Comparar pela identidade do conjunto, e não recalcular a origem a cada
    // execução, é o que faz o efeito sobreviver ao duplo disparo do StrictMode
    // sem transformar o recorte novo em ponto de partida.
    if (fadeRef.current?.to !== matched) {
      fadeRef.current = { from: fadeRef.current?.to ?? new Set(), to: matched }
    }
    const from = fadeRef.current.from

    // O primeiro quadro precisa estar escrito antes de os dados novos serem
    // desenhados: quem entra nasce invisível, quem sai continua opaco.
    applyMatchFade(map, 0)
    source.setData(buildPlacesGeoJson(places, matched, from))

    let cancel = () => {}
    let started = false

    // `setData` é assíncrono — o GeoJSON é analisado num worker. Começar o
    // tween antes de a fonte terminar de carregar faz a interpolação inteira
    // rodar sobre os dados antigos, e aí o recorte troca de estalo quando os
    // novos chegam. Foi exatamente o que aconteceu na primeira medição.
    function start() {
      if (started) return
      started = true
      cancel = animateProgress(MATCH_FADE_MS, (progress) => {
        applyMatchFade(map!, progress)
        if (progress === 1) {
          // Assenta o recorte: sem isto quem saiu continuaria na camada,
          // invisível, capturando clique e caixa de colisão de rótulo.
          source!.setData(buildPlacesGeoJson(places, matched))
        }
      })
    }

    function handleSourceData(event: MapSourceDataEvent) {
      if (event.sourceId !== PLACES_SOURCE_ID || !event.isSourceLoaded) return
      start()
    }

    map.on('sourcedata', handleSourceData)
    // Rede de segurança: se o evento não vier, os pins que entraram ficariam
    // presos em opacidade zero, que é pior do que uma transição perdida.
    const fallback = window.setTimeout(start, DATA_SETTLE_TIMEOUT_MS)

    return () => {
      map.off('sourcedata', handleSourceData)
      window.clearTimeout(fallback)
      cancel()
    }
  }, [map, places, matched])

  // Anel de seleção. Cresce a partir do miolo para amarrar o anel ao pin: com
  // vários pins agrupados, um anel que só aparece não diz qual deles ganhou.
  useEffect(() => {
    if (!map || !map.getLayer(PLACE_LAYERS.selected)) return
    map.setFilter(PLACE_LAYERS.selected, [
      '==',
      ['get', 'slug'],
      slug ?? NO_MATCH,
    ])
    if (!slug) return
    return animateProgress(reducedMotion ? 0 : SELECTION_GROW_MS, (progress) =>
      applySelectionRing(map, progress),
    )
  }, [map, slug, reducedMotion])

  // Realce do pin correspondente à linha sob o cursor. É a costura entre lista
  // e mapa: sem ela a lista nomeia lugares que o usuário não consegue localizar.
  useEffect(() => {
    if (!map || !map.getLayer(PLACE_LAYERS.hover)) return
    map.setFilter(PLACE_LAYERS.hover, [
      '==',
      ['get', 'slug'],
      hoveredSlug ?? NO_MATCH,
    ])
    if (!hoveredSlug) return
    return animateProgress(reducedMotion ? 0 : HOVER_GROW_MS, (progress) =>
      applyHoverRing(map, progress),
    )
  }, [map, hoveredSlug, reducedMotion])

  // Câmera. O painel de 380px cobre a faixa direita do mapa e o pin
  // recém-selecionado pode terminar embaixo dele; o padding resolve isso, e é a
  // razão de este movimento ser obrigatório em vez de estético.
  useEffect(() => {
    if (!map || !slug) return
    const target = places.find((place) => place.slug === slug)
    if (!target) return

    focusPlace(map, target, cameraPadding, { zoomIn: !fromPinRef.current })
    fromPinRef.current = false
  }, [map, slug, places, cameraPadding])

  // Interação: clique seleciona, clique no vazio limpa, cursor vira ponteiro.
  useEffect(() => {
    if (!map) return

    function handlePlaceClick(event: MapLayerMouseEvent) {
      const feature = event.features?.[0]
      // Durante o crossfade quem saiu do recorte ainda está na camada.
      // Permitir o clique seria selecionar o que está desaparecendo.
      if (feature?.properties?.matched !== true) return
      const clicked = feature.properties.slug
      if (typeof clicked === 'string') {
        fromPinRef.current = true
        select(clicked)
      }
    }

    function handleBackgroundClick(event: MapMouseEvent) {
      // O anel de favorito é bem maior que o miolo: sem ele na consulta,
      // clicar na borda de um favorito conta como clique no fundo e fecha o
      // painel que o clique acabou de abrir. O anel, porém, é desenhado para
      // todo favorito — inclusive fora do recorte, com opacidade zero — então
      // vale aqui a mesma regra do clique no pin: só conta quem está no
      // recorte, ou um anel invisível viraria uma zona morta.
      const hits = map!
        .queryRenderedFeatures(event.point, {
          layers: [PLACE_LAYERS.core, PLACE_LAYERS.favoriteRing],
        })
        .filter((hit) => hit.properties?.matched === true)
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
