'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { PaddingOptions } from 'maplibre-gl'
import type { Coordinates } from '@/domain/geo'
import {
  findDestinations,
  suggestBroaderQuery,
  type DiscoveryQuery,
} from '@/domain/discovery'
import type { ExplorePlace } from '@/domain/place'
import { useOrigin } from '@/components/layout/origin-context'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { fitPlaces } from '@/lib/map/camera'
import { useExitTransition } from '@/lib/motion/use-exit-transition'
import { useMapInstance } from '@/components/map/map-context'
import { PlacesLayer } from '@/components/map/PlacesLayer'
import { DiscoveryForm } from './DiscoveryForm'
import { DiscoveryResults } from './DiscoveryResults'
import { useSelectedPlace } from './use-selected-place'
import { useSetVisiblePlaceCount } from './visible-places-context'

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

function DiscoveryContent({
  places,
  origin,
}: DiscoveryViewProps & { origin: Coordinates }) {
  const [query, setQuery] = useState<DiscoveryQuery>({
    origin,
    timeBudget: '4h',
    maxDistanceKm: 150,
    categories: [],
    onlyUnvisited: true,
    onlyFavorites: false,
  })
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
  const { origin } = useOrigin()

  // A descoberta inteira parte de um ponto: distância, tempo de ida e volta e o
  // recorte do mapa. Sem origem não há o que calcular, e um formulário que
  // aceitasse a pergunta para devolver números medidos de lugar nenhum seria
  // pior do que não oferecer a tela.
  if (!origin) {
    return (
      <>
        <h1 className="sr-only">Descobrir destinos</h1>
        <OverlayPanel side="left" width={272}>
          <div className="flex flex-1 flex-col justify-center gap-3 px-4">
            <span className="instrument-label">Para onde vamos?</span>
            <p className="text-body leading-relaxed text-ink-muted">
              A descoberta mede distância e tempo de ida e volta a partir de onde
              suas viagens começam. Defina seu ponto de partida para usá-la.
            </p>
            <Link href="/perfil/origem" className="text-small text-accent">
              Definir ponto de partida
            </Link>
          </div>
        </OverlayPanel>
      </>
    )
  }

  // `useSelectedPlace` usa `useSearchParams`, que exige um limite de Suspense
  // para não travar a pré-renderização estática da rota. Mesmo padrão de
  // `ExploreView`.
  return (
    <Suspense fallback={null}>
      <DiscoveryContent places={places} origin={origin} />
    </Suspense>
  )
}
