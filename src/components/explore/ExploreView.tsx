'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import type { PaddingOptions } from 'maplibre-gl'
import { filterPlaces, mostRestrictiveCriterion } from '@/domain/filters'
import type { ExplorePlace } from '@/domain/place'
import { DEFAULT_ORIGIN } from '@/mocks/user'
import { useExitTransition } from '@/lib/motion/use-exit-transition'
import { PlacesLayer } from '@/components/map/PlacesLayer'
import { DiscoveryLauncher } from './DiscoveryLauncher'
import { FilterRail } from './FilterRail'
import { PlacePanel } from './PlacePanel'
import { useExploreFilters } from './use-explore-filters'
import { useSelectedPlace } from './use-selected-place'
import { useSetVisiblePlaceCount } from './visible-places-context'

/**
 * Espaço tomado pelos painéis desta rota: 232px de trilha à esquerda, 380px de
 * painel de lugar à direita. Constante de módulo porque um literal novo a cada
 * render remontaria o efeito de câmera.
 */
const CAMERA_PADDING: PaddingOptions = {
  top: 60,
  right: 380,
  bottom: 40,
  left: 232,
}

interface ExploreViewProps {
  places: ExplorePlace[]
}

function ExploreContent({ places }: ExploreViewProps) {
  const { filters, setFilters, reset, isDefault } = useExploreFilters()
  const { slug, select } = useSelectedPlace()
  const setVisibleCount = useSetVisiblePlaceCount()
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)

  const visible = useMemo(
    () => filterPlaces(places, filters, DEFAULT_ORIGIN),
    [places, filters],
  )

  // Qual restrição está eliminando mais lugares. O domínio já filtrou, então
  // ele sabe a resposta — devolvê-la como prosa seria devolver trabalho feito.
  const relaxation = useMemo(
    () =>
      visible.length === 0
        ? mostRestrictiveCriterion(places, filters, DEFAULT_ORIGIN)
        : null,
    [places, filters, visible.length],
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
