'use client'

import { Suspense } from 'react'
import type { ExplorePlace } from '@/domain/place'
import { PlacesLayer } from '@/components/map/PlacesLayer'

interface ExploreViewProps {
  places: ExplorePlace[]
}

export function ExploreView({ places }: ExploreViewProps) {
  // `useSelectedPlace` (dentro de `PlacesLayer`) usa `useSearchParams`, que
  // exige um limite de Suspense para não travar a pré-renderização estática
  // da rota. `PlacesLayer` não desenha nada, então o fallback nunca aparece.
  return (
    <Suspense fallback={null}>
      <PlacesLayer places={places} />
    </Suspense>
  )
}
