'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { PaddingOptions } from 'maplibre-gl'
import type { Coordinates } from '@/domain/geo'
import {
  findDestinations,
  nearestPlaceKm,
  suggestBroaderQuery,
  type DiscoveryQuery,
} from '@/domain/discovery'
import type { ExplorePlace } from '@/domain/place'
import { useOrigin } from '@/components/layout/origin-context'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { Button } from '@/components/ui/Button'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { useMyLocation } from '@/components/onboarding/use-my-location'
import { setHomeAction } from '@/app/actions/profile-actions'
import { fitPlaces } from '@/lib/map/camera'
import { useExitTransition } from '@/lib/motion/use-exit-transition'
import { useMapInstance } from '@/components/map/map-context'
import { PlacesLayer } from '@/components/map/PlacesLayer'
import { DiscoveryForm } from './DiscoveryForm'
import { DiscoveryResults } from './DiscoveryResults'
import { PlacePanel } from './PlacePanel'
import { useSelectedPlace } from './use-selected-place'
import { useSetVisiblePlaceCount } from './visible-places-context'

/**
 * Formulário à esquerda, resultados à direita, mais o cromo flutuante — mesma
 * conta de `ExploreView`, e pelo mesmo motivo: o MapLibre não lê variável CSS.
 */
const CAMERA_PADDING: PaddingOptions = {
  top: 56 + 24,
  right: 420 + 24,
  bottom: 36 + 24,
  left: 380 + 24,
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
  const { slug, select } = useSelectedPlace()
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

  // Só interessa quando o resultado é zero, mas sai barato e mantém o cálculo
  // fora do corpo do componente de apresentação.
  const nearestKm = useMemo(
    () => nearestPlaceKm(places, query.origin),
    [places, query.origin],
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

  /*
   * O destino escolhido ocupa o lugar da lista, e não some com ela.
   *
   * Antes disto, escolher um destino na descoberta gravava `?place=` na URL e
   * **nada acontecia**: só o Explorar renderizava o painel, então a pessoa fazia
   * a busca inteira, tocava no destino e ficava olhando a mesma lista. O fluxo
   * que dá nome ao produto terminava aí. Ver RASTRO-001 da auditoria.
   *
   * Substitui em vez de empilhar porque os dois moram no mesmo lado da tela — e
   * porque fechar o painel devolve a lista, que continua em estado. É o que
   * permite comparar dois destinos sem refazer a busca.
   */
  const selected = places.find((place) => place.slug === slug) ?? null
  const { rendered: panelPlace, exiting: panelExiting } =
    useExitTransition(selected)

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
      {panelPlace ? (
        <PlacePanel
          place={panelPlace}
          exiting={panelExiting}
          onClose={() => select(null)}
        />
      ) : shownResults ? (
        <DiscoveryResults
          results={shownResults}
          onSelect={select}
          onHover={setHoveredSlug}
          suggestion={suggestion}
          onApplySuggestion={applySuggestion}
          nearestKm={nearestKm}
          exiting={exiting}
        />
      ) : null}
    </>
  )
}

/**
 * A descoberta antes de existir uma partida.
 *
 * Era um parágrafo e um link para outra tela — a auditoria (RASTRO-003) chamou
 * de muro, e era: a tela que responde a pergunta central do produto era a única
 * que não respondia nada sem configuração prévia.
 *
 * Agora resolve **aqui**, num toque, e só manda para a tela de origem quem
 * precisar de controle fino. A recusa da permissão não é beco: a mensagem diz o
 * que houve e o link continua embaixo.
 */
function DiscoveryWithoutOrigin() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { locate, locating, error: locationError } = useMyLocation({
    onLocated: useCallback(
      (coordinates: Coordinates, nome: string) => {
        setSaving(true)
        void setHomeAction(coordinates.latitude, coordinates.longitude, nome)
          .then((resultado) => {
            if (!resultado.ok) {
              setSaveError(resultado.message)
              return
            }
            // A origem passou a existir no servidor; recarregar troca este muro
            // pelo formulário de verdade, já com a partida preenchida.
            router.refresh()
          })
          .finally(() => setSaving(false))
      },
      [router],
    ),
  })

  const ocupado = locating || saving

  return (
    <>
      <h1 className="sr-only">Descobrir destinos</h1>
      <OverlayPanel side="left">
        <div className="flex flex-1 flex-col justify-center gap-3 px-4">
          <span className="instrument-label">Para onde vamos?</span>
          <p className="text-body leading-relaxed text-ink-muted">
            A descoberta mede distância e tempo de ida e volta a partir de onde
            você está. Diga de onde parte e ela responde.
          </p>

          <Button type="button" onClick={locate} disabled={ocupado}>
            {locating
              ? 'Localizando…'
              : saving
                ? 'Salvando…'
                : 'Usar minha localização'}
          </Button>

          {locationError ? (
            <InlineMessage tone="info">{locationError}</InlineMessage>
          ) : null}
          {saveError ? (
            <InlineMessage tone="error">{saveError}</InlineMessage>
          ) : null}

          <Link href="/perfil/origem" className="text-small text-accent">
            Escolher no mapa ou buscar endereço
          </Link>
        </div>
      </OverlayPanel>
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
    return <DiscoveryWithoutOrigin />
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
