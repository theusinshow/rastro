'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import type { PaddingOptions } from 'maplibre-gl'
import { filterPlaces, mostRestrictiveCriterion } from '@/domain/filters'
import type { ExplorePlace } from '@/domain/place'
import { useOrigin } from '@/components/layout/origin-context'
import { useExitTransition } from '@/lib/motion/use-exit-transition'
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
  right: 380 + 24,
  bottom: 36 + 24,
  left: 280 + 24,
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
  const { origin } = useOrigin()
  const { filters, setFilters, reset, isDefault } = useExploreFilters(
    origin !== null,
  )
  const { slug, select } = useSelectedPlace()
  const setVisibleCount = useSetVisiblePlaceCount()
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)

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

  return (
    <>
      <h1 className="sr-only">Explorar o mapa</h1>

      <PlacesLayer
        places={places}
        visible={visible}
        hoveredSlug={hoveredSlug}
        cameraPadding={CAMERA_PADDING}
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

      {panelPlace ? (
        <PlacePanel
          place={panelPlace}
          exiting={exiting}
          onClose={() => select(null)}
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
