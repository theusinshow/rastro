'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatCoordinate, type Coordinates } from '@/domain/geo'
import { searchAddressAction } from '@/app/actions/geocoding-actions'
import { setHomeAction } from '@/app/actions/profile-actions'
import type { GeocodedPlace } from '@/lib/geocoding'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { useOrigin } from '@/components/layout/origin-context'
import { PointPicker } from '@/components/map/PointPicker'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { SectionHeader } from '@/components/ui/Section'

export function OriginSetup() {
  const router = useRouter()
  const { origin: current, label: currentLabel } = useOrigin()
  const [point, setPoint] = useState<Coordinates | null>(current)
  const [label, setLabel] = useState(currentLabel ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodedPlace[] | null>(null)
  const [searching, startSearch] = useTransition()

  // Identidade estável: sem `useCallback`, o efeito do PointPicker remonta a
  // cada render e o modo de mira pisca.
  //
  // Clicar no mapa NÃO apaga o rótulo escolhido na busca: quem buscou "Palhoça"
  // e depois ajustou o pino algumas quadras continua em Palhoça.
  const handlePick = useCallback((picked: Coordinates) => {
    setPoint(picked)
  }, [])

  function search() {
    startSearch(async () => {
      setResults(await searchAddressAction(query))
    })
  }

  /**
   * Escolher um resultado grava coordenada E rótulo juntos.
   *
   * É o ponto todo desta busca: antes o rótulo era texto livre e podia discordar
   * em silêncio da coordenada — este perfil dizia "Palhoça, SC" com o pino 82 km
   * dali, no alto da serra, e toda distância do produto saía errada parecendo
   * certa.
   */
  function choose(result: GeocodedPlace) {
    setPoint(result.coordinates)
    setLabel(result.label)
    setResults(null)
    setQuery('')
  }

  function save() {
    if (!point) return
    startTransition(async () => {
      const result = await setHomeAction(point.latitude, point.longitude, label)
      if (result.ok) router.push('/')
      else setError(result.message)
    })
  }

  return (
    <>
      <PointPicker onPick={handlePick} />

      <OverlayPanel side="right">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <div>
            <span className="instrument-label">Ponto de partida</span>
            <p className="mt-1.5 text-body leading-relaxed text-ink-muted">
              Busque o endereço ou clique no mapa. Toda distância e todo cálculo
              de tempo do Rastro partem daqui.
            </p>
          </div>

          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <Field label="Buscar endereço">
              {(field) => (
                <Input
                  {...field}
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return
                    // Sem isto o Enter envia o formulário do painel e a busca
                    // some antes de acontecer.
                    event.preventDefault()
                    search()
                  }}
                  placeholder="Rua, bairro ou cidade"
                />
              )}
            </Field>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={search}
              disabled={searching || query.trim().length < 3}
            >
              {searching ? 'Buscando…' : 'Buscar'}
            </Button>

            {results !== null && results.length === 0 ? (
              <InlineMessage tone="info">
                Nenhum endereço encontrado. Clique no mapa para marcar o ponto.
              </InlineMessage>
            ) : null}

            {results && results.length > 0 ? (
              <ul className="-mx-5 border-y border-line">
                {results.map((result) => (
                  <li
                    key={`${result.label}-${result.coordinates.latitude}`}
                    className="border-b border-line last:border-b-0"
                  >
                    <button
                      type="button"
                      onClick={() => choose(result)}
                      className="press flex w-full flex-col gap-0.5 px-5 py-3
                                 text-left hover:bg-overlay"
                    >
                      <span className="text-body text-ink">{result.label}</span>
                      <span className="instrument-value text-micro text-ink-faint">
                        {formatCoordinate(result.coordinates.latitude)}{' '}
                        {formatCoordinate(result.coordinates.longitude)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 border-t border-line pt-4">
            <SectionHeader label="Coordenada" />
            <p className="instrument-value text-lead text-ink">
              {point
                ? `${formatCoordinate(point.latitude)} ${formatCoordinate(point.longitude)}`
                : 'aguardando o clique'}
            </p>
          </div>

          <Field label="Como chamar">
            {(field) => (
              <Input
                {...field}
                type="text"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Palhoça, SC"
              />
            )}
          </Field>

          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

          <Button
            type="button"
            variant="solid"
            size="sm"
            onClick={save}
            disabled={!point || pending}
            className="w-full"
          >
            {pending ? 'Gravando…' : 'Definir origem'}
          </Button>
        </div>
      </OverlayPanel>
    </>
  )
}
