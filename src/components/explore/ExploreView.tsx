'use client'

import { Suspense } from 'react'
import type { ExplorePlace } from '@/domain/place'
import { PlacesLayer } from '@/components/map/PlacesLayer'
import { PlacePanel } from './PlacePanel'
import { useSelectedPlace } from './use-selected-place'

interface ExploreViewProps {
  places: ExplorePlace[]
}

function ExploreContent({ places }: ExploreViewProps) {
  const { slug, select } = useSelectedPlace()
  const selected = places.find((place) => place.slug === slug) ?? null

  return (
    <>
      <PlacesLayer places={places} />
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
