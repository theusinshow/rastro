'use client'

import { Suspense, useMemo, useState } from 'react'
import { findDestinations, type DiscoveryQuery } from '@/domain/discovery'
import type { ExplorePlace } from '@/domain/place'
import { DEFAULT_ORIGIN } from '@/mocks/user'
import { PlacesLayer } from '@/components/map/PlacesLayer'
import { DiscoveryForm } from './DiscoveryForm'
import { DiscoveryResults } from './DiscoveryResults'
import { useSelectedPlace } from './use-selected-place'

const INITIAL_QUERY: DiscoveryQuery = {
  origin: DEFAULT_ORIGIN,
  timeBudget: '4h',
  maxDistanceKm: 150,
  categories: [],
  onlyUnvisited: true,
  onlyFavorites: false,
}

interface DiscoveryViewProps {
  places: ExplorePlace[]
}

function DiscoveryContent({ places }: DiscoveryViewProps) {
  const [query, setQuery] = useState<DiscoveryQuery>(INITIAL_QUERY)
  const [submitted, setSubmitted] = useState<DiscoveryQuery | null>(null)
  const { select } = useSelectedPlace()

  const results = useMemo(
    () => (submitted ? findDestinations(places, submitted) : null),
    [places, submitted],
  )

  // Antes de buscar, o mapa mostra tudo. Depois, só o que cabe — o recorte é a
  // resposta visual da busca.
  const visible = results ? results.map((result) => result.place) : places

  return (
    <>
      <PlacesLayer places={visible} />
      <DiscoveryForm
        query={query}
        onChange={setQuery}
        onSubmit={() => setSubmitted(query)}
      />
      {results ? (
        <DiscoveryResults results={results} onSelect={select} />
      ) : null}
    </>
  )
}

export function DiscoveryView({ places }: DiscoveryViewProps) {
  // `useSelectedPlace` usa `useSearchParams`, que exige um limite de Suspense
  // para não travar a pré-renderização estática da rota. Mesmo padrão de
  // `ExploreView`.
  return (
    <Suspense fallback={null}>
      <DiscoveryContent places={places} />
    </Suspense>
  )
}
