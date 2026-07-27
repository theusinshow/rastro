'use client'

import { Suspense, useEffect, useMemo } from 'react'
import { filterPlaces } from '@/domain/filters'
import type { ExplorePlace } from '@/domain/place'
import { DEFAULT_ORIGIN } from '@/mocks/user'
import { PlacesLayer } from '@/components/map/PlacesLayer'
import { FilterRail } from './FilterRail'
import { PlacePanel } from './PlacePanel'
import { useExploreFilters } from './use-explore-filters'
import { useSelectedPlace } from './use-selected-place'
import { useSetVisiblePlaceCount } from './visible-places-context'

interface ExploreViewProps {
  places: ExplorePlace[]
}

function ExploreContent({ places }: ExploreViewProps) {
  const { filters, setFilters, reset, isDefault } = useExploreFilters()
  const { slug, select } = useSelectedPlace()
  const setVisibleCount = useSetVisiblePlaceCount()

  const visible = useMemo(
    () => filterPlaces(places, filters, DEFAULT_ORIGIN),
    [places, filters],
  )

  useEffect(() => {
    setVisibleCount(visible.length)
    return () => setVisibleCount(null)
  }, [visible.length, setVisibleCount])

  // A seleção sobrevive à filtragem: se o lugar aberto sair do filtro, o painel
  // continua aberto. Fechá-lo sozinho pareceria um bug para quem só mexeu num
  // filtro sem intenção de fechar nada.
  const selected = places.find((place) => place.slug === slug) ?? null

  return (
    <>
      <PlacesLayer places={visible} />
      <FilterRail
        filters={filters}
        setFilters={setFilters}
        reset={reset}
        isDefault={isDefault}
        resultCount={visible.length}
        totalCount={places.length}
      />
      {selected ? (
        <PlacePanel place={selected} onClose={() => select(null)} />
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
