'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import type { PaddingOptions } from 'maplibre-gl'
import {
  findDestinations,
  suggestBroaderQuery,
  type DiscoveryQuery,
} from '@/domain/discovery'
import type { ExplorePlace } from '@/domain/place'
import { DEFAULT_ORIGIN } from '@/mocks/user'
import { fitPlaces } from '@/lib/map/camera'
import { useExitTransition } from '@/lib/motion/use-exit-transition'
import { useMapInstance } from '@/components/map/map-context'
import { PlacesLayer } from '@/components/map/PlacesLayer'
import { DiscoveryForm } from './DiscoveryForm'
import { DiscoveryResults } from './DiscoveryResults'
import { useSelectedPlace } from './use-selected-place'
import { useSetVisiblePlaceCount } from './visible-places-context'

const INITIAL_QUERY: DiscoveryQuery = {
  origin: DEFAULT_ORIGIN,
  timeBudget: '4h',
  maxDistanceKm: 150,
  categories: [],
  onlyUnvisited: true,
  onlyFavorites: false,
}

/** Formulário de 272px à esquerda, resultados de 340px à direita. */
const CAMERA_PADDING: PaddingOptions = {
  top: 60,
  right: 340,
  bottom: 40,
  left: 272,
}

interface DiscoveryViewProps {
  places: ExplorePlace[]
}

function DiscoveryContent({ places }: DiscoveryViewProps) {
  const [query, setQuery] = useState<DiscoveryQuery>(INITIAL_QUERY)
  const [submitted, setSubmitted] = useState<DiscoveryQuery | null>(null)
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null)
  const { select } = useSelectedPlace()
  const map = useMapInstance()
  const setVisibleCount = useSetVisiblePlaceCount()

  const results = useMemo(
    () => (submitted ? findDestinations(places, submitted) : null),
    [places, submitted],
  )

  // Antes de buscar, o mapa mostra tudo. Depois, só o que cabe — o recorte é a
  // resposta visual da busca.
  const visible = useMemo(
    () => (results ? results.map((result) => result.place) : places),
    [results, places],
  )

  const suggestion = useMemo(
    () =>
      submitted && results && results.length === 0
        ? suggestBroaderQuery(places, submitted)
        : null,
    [places, submitted, results],
  )

  // Um instrumento cujo mostrador desaparece ao trocar de modo não é confiável,
  // e é justamente na descoberta que a contagem tem mais significado.
  useEffect(() => {
    setVisibleCount(visible.length)
    return () => setVisibleCount(null)
  }, [visible.length, setVisibleCount])

  // A pergunta central do produto é feita apertando este botão. Sem recompor o
  // enquadramento, o mapa não responde: os destinos ficam espalhados, alguns
  // fora de tela e alguns embaixo das duas colunas.
  useEffect(() => {
    if (!map || !results || results.length === 0) return
    fitPlaces(
      map,
      results.map((result) => result.place),
      CAMERA_PADDING,
    )
  }, [map, results])

  const { rendered: shownResults, exiting } = useExitTransition(results)

  function applySuggestion(next: DiscoveryQuery) {
    setQuery(next)
    setSubmitted(next)
  }

  return (
    <>
      <h1 className="sr-only">Descobrir destinos</h1>

      <PlacesLayer
        places={places}
        visible={visible}
        hoveredSlug={hoveredSlug}
        cameraPadding={CAMERA_PADDING}
      />
      <DiscoveryForm
        query={query}
        onChange={setQuery}
        onSubmit={() => setSubmitted(query)}
      />
      {shownResults ? (
        <DiscoveryResults
          results={shownResults}
          onSelect={select}
          onHover={setHoveredSlug}
          suggestion={suggestion}
          onApplySuggestion={applySuggestion}
          exiting={exiting}
        />
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
