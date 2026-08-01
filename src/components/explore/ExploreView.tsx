'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import type { PaddingOptions } from 'maplibre-gl'
import { mergeAnchor, type FuelAnchor, type FuelStation } from '@/domain/fuel-stations'
import { filterPlaces, mostRestrictiveCriterion } from '@/domain/filters'
import type { ExplorePlace } from '@/domain/place'
import { useOrigin } from '@/components/layout/origin-context'
import { useExitTransition } from '@/lib/motion/use-exit-transition'
import { focusPlace } from '@/lib/map/camera'
import { FuelPanel } from '@/components/fuel/FuelPanel'
import { FuelToggle } from '@/components/fuel/FuelToggle'
import { useFuelStations } from '@/components/fuel/use-fuel-stations'
import { ExploreTour } from '@/components/map/ExploreTour'
import { FuelStationsLayer } from '@/components/map/FuelStationsLayer'
import { useMapInstance } from '@/components/map/map-context'
import { PlacesLayer } from '@/components/map/PlacesLayer'
import { DiscoveryLauncher } from './DiscoveryLauncher'
import { FilterRail } from './FilterRail'
import { PlacePanel } from './PlacePanel'
import { useExploreFilters } from './use-explore-filters'
import { useSelectedPlace } from './use-selected-place'
import { useSetVisiblePlaceCount } from './visible-places-context'

/**
 * Espaço tomado pelo cromo desta rota. Precisa bater com `--panel-narrow`,
 * `--panel-base`, `--bar-height`, `--status-height` e `--chrome-gap` de
 * `globals.css`: a câmera do MapLibre roda em JavaScript e não lê variável CSS,
 * então os números são espelhados à mão. Divergir faz o pin selecionado terminar
 * embaixo de um painel.
 *
 * Com o cromo flutuante (ADR 0010) cada lado soma a folga: painel de 280px mais
 * 12px de folga de cada borda; barra de 56px mais duas folgas.
 *
 * Constante de módulo porque um literal novo a cada render remontaria o efeito
 * de câmera.
 */
const CAMERA_PADDING: PaddingOptions = {
  top: 56 + 24,
  right: 420 + 24,
  bottom: 36 + 24,
  left: 380 + 24,
}

/**
 * Ponto de referência inerte para quando não há origem.
 *
 * `filterPlaces` exige `Coordinates`, mas só o critério de raio a consulta — e
 * sem origem o raio já vem nulo. Constante de módulo para não recriar o objeto
 * a cada render e invalidar os memos à toa.
 */
const NO_ORIGIN = { latitude: 0, longitude: 0 }

interface ExploreViewProps {
  places: ExplorePlace[]
}

function ExploreContent({ places }: ExploreViewProps) {
  const { origin, label: originLabel } = useOrigin()
  const { filters, setFilters, reset, isDefault } = useExploreFilters(
    origin !== null,
  )
  const { slug, select } = useSelectedPlace()
  const setVisibleCount = useSetVisiblePlaceCount()
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const map = useMapInstance()
  const fuel = useFuelStations()

  // Sem origem, `useExploreFilters` já devolve `radiusKm: null` — e o raio é o
  // único critério que consulta a origem. Os outros três não a tocam, então
  // este ponto de referência nunca chega a ser usado para nada.
  const effectiveOrigin = origin ?? NO_ORIGIN

  const visible = useMemo(
    () => filterPlaces(places, filters, effectiveOrigin),
    [places, filters, effectiveOrigin],
  )

  // Qual restrição está eliminando mais lugares. O domínio já filtrou, então
  // ele sabe a resposta — devolvê-la como prosa seria devolver trabalho feito.
  const relaxation = useMemo(
    () =>
      visible.length === 0
        ? mostRestrictiveCriterion(places, filters, effectiveOrigin)
        : null,
    [places, filters, visible.length, effectiveOrigin],
  )

  useEffect(() => {
    setVisibleCount(visible.length)
    return () => setVisibleCount(null)
  }, [visible.length, setVisibleCount])

  // A seleção sobrevive à filtragem: se o lugar aberto sair do filtro, o painel
  // continua aberto. Fechá-lo sozinho pareceria um bug para quem só mexeu num
  // filtro sem intenção de fechar nada.
  const selected = places.find((place) => place.slug === slug) ?? null
  const { rendered: panelPlace, exiting } = useExitTransition(selected)

  /*
   * "Perto de quê?" — as três respostas, na ordem em que respondem melhor.
   *
   * O lugar selecionado vem primeiro porque é a pergunta mais específica que a
   * pessoa já fez na tela; a origem do perfil vem depois; o centro do mapa
   * fecha, e é o que garante que a busca funcione para quem ainda não definiu
   * origem nenhuma.
   *
   * O centro do mapa é lido no CLIQUE, e não aqui: assinar `useMapView` faria
   * a tela inteira repintar a cada quadro de um arrasto.
   */
  const mapAnchor = useCallback((): FuelAnchor | null => {
    if (!map) return null
    const center = map.getCenter()
    return {
      kind: 'mapa',
      label: 'centro do mapa',
      coordinates: { latitude: center.lat, longitude: center.lng },
    }
  }, [map])

  const anchorOptions = useMemo(() => {
    const options: FuelAnchor[] = []
    if (selected) {
      options.push({
        kind: 'lugar',
        label: selected.name,
        coordinates: selected,
      })
    }
    if (origin) {
      options.push({
        kind: 'origem',
        label: originLabel ?? 'minha origem',
        coordinates: origin,
      })
    }
    options.push({
      kind: 'mapa',
      label: 'centro do mapa',
      // Substituído pela leitura fresca no clique — ver `handleSearchAt`.
      coordinates: origin ?? NO_ORIGIN,
    })
    return options
  }, [selected, origin, originLabel])

  /** O chip "centro do mapa" precisa do centro de AGORA, não do último render. */
  const handleSearchAt = useCallback(
    (anchor: FuelAnchor) => {
      fuel.searchAt(anchor.kind === 'mapa' ? (mapAnchor() ?? anchor) : anchor)
    },
    [fuel, mapAnchor],
  )

  /*
   * Ligar a camada fecha o painel do lugar.
   *
   * Os dois moram no mesmo lado da tela, e empilhar painéis apagaria qual deles
   * tem o teclado — numa folha inferior de celular nem caberiam. Quem acabou de
   * pedir postos quer ver postos; o lugar continua selecionável na lista, e
   * escolher um de volta devolve o painel dele por cima, com os losangos ainda
   * no mapa.
   */
  function toggleFuel() {
    if (fuel.active) {
      fuel.close()
      return
    }
    const first = anchorOptions[0]
    const anchor = first?.kind === 'mapa' ? mapAnchor() : first
    if (!anchor) return
    select(null)
    fuel.open(anchor)
  }

  const centerOnStation = useCallback(
    (station: FuelStation) => {
      if (!map) return
      focusPlace(map, station, CAMERA_PADDING, { zoomIn: true })
    },
    [map],
  )

  return (
    <>
      <h1 className="sr-only">Explorar o mapa</h1>

      <PlacesLayer
        places={places}
        visible={visible}
        hoveredSlug={hoveredSlug}
        cameraPadding={CAMERA_PADDING}
      />

      {/* O passeio pelos lugares, que antes só existia na tela de entrada.
          Só roda com o mapa livre — com um lugar aberto na URL a câmera já tem
          um trabalho, e disputar com ela seria arrancar da pessoa o lugar que
          ela pediu para ver. Termina no primeiro gesto e não volta. */}
      <ExploreTour
        places={places}
        active={slug === null}
        cameraPadding={CAMERA_PADDING}
        onFocus={setHoveredSlug}
      />

      {fuel.active ? (
        <FuelStationsLayer
          stations={fuel.stations}
          selectedId={fuel.selectedId}
          onSelect={fuel.select}
        />
      ) : null}

      <FuelToggle
        active={fuel.active}
        count={fuel.status === 'pronto' ? fuel.stations.length : null}
        busy={fuel.status === 'buscando'}
        onToggle={toggleFuel}
      />

      {/* Antes da trilha de propósito: renderizado depois, o CTA principal era
          a 28ª parada de tabulação, atrás de dezenove controles de refinamento.
          Os dois são posicionados de forma absoluta, então a ordem visual não
          muda — só a de foco. */}
      <DiscoveryLauncher />

      <FilterRail
        filters={filters}
        setFilters={setFilters}
        reset={reset}
        isDefault={isDefault}
        visible={visible}
        totalCount={places.length}
        selectedSlug={slug}
        onSelectPlace={select}
        onHoverPlace={setHoveredSlug}
        relaxation={relaxation}
        hasOrigin={origin !== null}
      />

      {/* Um painel por vez do lado direito. O lugar escolhido tem precedência:
          ele é o objeto do produto, e o posto é o serviço em volta dele. Fechar
          o lugar devolve a lista de postos, que continua no estado em que
          estava — os losangos nunca saíram do mapa. */}
      {panelPlace ? (
        <PlacePanel
          place={panelPlace}
          exiting={exiting}
          onClose={() => select(null)}
        />
      ) : fuel.active ? (
        <FuelPanel
          anchor={fuel.anchor}
          anchorOptions={mergeAnchor(anchorOptions, fuel.anchor)}
          radiusM={fuel.radiusM}
          status={fuel.status}
          stations={fuel.stations}
          failure={fuel.failure}
          searchedAt={fuel.searchedAt}
          selectedId={fuel.selectedId}
          origin={origin}
          onSelect={fuel.select}
          onCenter={centerOnStation}
          onSearchAt={handleSearchAt}
          onChangeRadius={fuel.changeRadius}
          onRetry={fuel.retry}
          onClose={fuel.close}
        />
      ) : null}
    </>
  )
}

export function ExploreView({ places }: ExploreViewProps) {
  // `useSelectedPlace` (usado aqui e dentro de `PlacesLayer`) usa
  // `useSearchParams`, que exige um limite de Suspense para não travar a
  // pré-renderização estática da rota. Nada aqui desenha algo síncrono antes
  // dos dados de busca, então o fallback nunca aparece.
  return (
    <Suspense fallback={null}>
      <ExploreContent places={places} />
    </Suspense>
  )
}
