'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  createTripAction,
  measureTripAction,
  proposeTripAction,
  type ProposedItinerary,
} from '@/app/actions/trip-actions'
import {
  MINUTES_PER_STOP,
  TIME_BUDGET_LABELS,
  TIME_BUDGET_MINUTES,
  type TimeBudget,
} from '@/domain/discovery'
import { RADIUS_OPTIONS_KM } from '@/domain/filters'
import { formatDistanceKm, formatDurationMinutes } from '@/domain/geo'
import {
  CATEGORY_LABELS,
  PLACE_CATEGORIES,
  type PlaceCategory,
} from '@/domain/place'
import { useOrigin } from '@/components/layout/origin-context'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Field, Input, Select } from '@/components/ui/Field'
import { InlineMessage } from '@/components/ui/InlineMessage'

const TIME_BUDGETS = Object.keys(TIME_BUDGET_MINUTES) as TimeBudget[]

/** Três a cinco paradas: mais que isso deixa de ser passeio e vira maratona. */
const MAX_STOPS = 4

interface TripProposalFormProps {
  /** Catálogo, para o seletor de destino. Vem da página, nunca buscado no cliente. */
  places: { id: string; name: string }[]
  /** Paradas escolhidas à mão, quando o usuário chegou pelo painel de um lugar. */
  initialPlaceIds: string[]
}

export function TripProposalForm({
  places,
  initialPlaceIds,
}: TripProposalFormProps) {
  const router = useRouter()
  const { label: originLabel } = useOrigin()
  const [pending, startTransition] = useTransition()

  const [timeBudget, setTimeBudget] = useState<TimeBudget>('dia-inteiro')
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(200)
  const [categories, setCategories] = useState<PlaceCategory[]>([])
  const [anchorPlaceId, setAnchorPlaceId] = useState<string | null>(null)

  const [proposal, setProposal] = useState<ProposedItinerary | null>(null)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  // Chegou pelo painel de um lugar: mede o que já foi escolhido, sem propor nada.
  const [manualIds, setManualIds] = useState<string[]>(initialPlaceIds)
  const isManual = initialPlaceIds.length > 0

  function handleOutcome(
    outcome: ProposedItinerary | { ok: false; message: string },
  ) {
    if (!outcome.ok) {
      setProposal(null)
      setMessage(outcome.message)
      return
    }
    setMessage(null)
    setProposal(outcome)
    // Nome sugerido é o destino mais distante — a parada que dá identidade à
    // volta. Continua editável: quem viaja sabe nomear melhor.
    if (!title) setTitle(outcome.stops.at(-1)?.name ?? '')
  }

  function propose() {
    startTransition(async () => {
      handleOutcome(
        await proposeTripAction({
          timeBudget,
          maxDistanceKm,
          categories,
          anchorPlaceId,
          maxStops: MAX_STOPS,
        }),
      )
    })
  }

  function measure(ids: string[]) {
    startTransition(async () => {
      handleOutcome(await measureTripAction(ids))
    })
  }

  function removeStop(id: string) {
    const remaining = (proposal?.stops ?? []).map((s) => s.id).filter((s) => s !== id)
    setManualIds(remaining)
    if (remaining.length === 0) {
      setProposal(null)
      return
    }
    measure(remaining)
  }

  function save() {
    startTransition(async () => {
      const result = await createTripAction({
        title,
        placeIds: (proposal?.stops ?? []).map((stop) => stop.id),
      })
      if (!result.ok) {
        setMessage(result.message)
        return
      }
      router.push(`/viagens/${result.slug}`)
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className="border-b border-line px-4 py-4">
          <span className="instrument-label">Partida</span>
          <p className="instrument-value mt-1.5 text-body text-ink">
            {originLabel ?? '—'}
          </p>
          <Link
            href="/perfil/origem"
            className="mt-1 inline-block text-micro text-ink-faint
                       transition-colors hover:text-ink-muted"
          >
            Mudar ponto de partida
          </Link>
        </section>

        {isManual ? (
          <section className="border-b border-line px-4 py-4">
            <span className="instrument-label">Paradas escolhidas</span>
            <p className="mt-2 text-small leading-relaxed text-ink-muted">
              Você escolheu estas no painel de cada lugar. A ordem é calculada.
            </p>
            {manualIds.length > 0 && !proposal && !pending ? (
              <Button
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={() => measure(manualIds)}
              >
                Medir o roteiro
              </Button>
            ) : null}
          </section>
        ) : (
          <>
            <section className="border-b border-line px-4 py-4">
              <Field
                label="Destino, se você já sabe"
                hint="Ele nunca é descartado ao ajustar o roteiro."
              >
                {(fieldProps) => (
                  <Select
                    {...fieldProps}
                    value={anchorPlaceId ?? ''}
                    onChange={(event) =>
                      setAnchorPlaceId(event.target.value || null)
                    }
                  >
                    <option value="">Qualquer um — me proponha a volta</option>
                    {places.map((place) => (
                      <option key={place.id} value={place.id}>
                        {place.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </section>

            <section className="border-b border-line px-4 py-4">
              <span className="instrument-label">Tempo disponível</span>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {TIME_BUDGETS.map((budget) => (
                  <Chip
                    key={budget}
                    active={timeBudget === budget}
                    onClick={() => setTimeBudget(budget)}
                  >
                    {TIME_BUDGET_LABELS[budget]}
                  </Chip>
                ))}
              </div>
              <p className="mt-2 text-micro leading-relaxed text-ink-faint">
                Reserva {MINUTES_PER_STOP} minutos parado em cada parada.
              </p>
            </section>

            <section className="border-b border-line px-4 py-4">
              <span className="instrument-label">Distância máxima</span>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {RADIUS_OPTIONS_KM.map((radius) => (
                  <Chip
                    key={radius}
                    active={maxDistanceKm === radius}
                    onClick={() => setMaxDistanceKm(radius)}
                  >
                    {radius} km
                  </Chip>
                ))}
              </div>
            </section>

            <section className="border-b border-line px-4 py-4">
              <span className="instrument-label">Categorias</span>
              <div className="mt-2.5 flex flex-wrap gap-1">
                {PLACE_CATEGORIES.map((category) => (
                  <Chip
                    key={category}
                    active={categories.includes(category)}
                    onClick={() =>
                      setCategories((current) =>
                        current.includes(category)
                          ? current.filter((item) => item !== category)
                          : [...current, category],
                      )
                    }
                  >
                    {CATEGORY_LABELS[category]}
                  </Chip>
                ))}
              </div>
            </section>
          </>
        )}

        {message ? (
          <div className="px-4 py-4">
            <InlineMessage tone="warn">{message}</InlineMessage>
          </div>
        ) : null}

        {proposal ? (
          <section className="border-b border-line">
            <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
              <span className="instrument-label">Roteiro proposto</span>
              <span className="instrument-value text-small text-ink">
                {formatDistanceKm(proposal.roadKm)} km ·{' '}
                {formatDurationMinutes(proposal.minutes)}
              </span>
            </div>

            <ul>
              {proposal.stops.map((stop, index) => (
                <li
                  key={stop.id}
                  className="flex items-baseline gap-3 border-b border-line px-4 py-3"
                >
                  <span className="instrument-value w-5 shrink-0 text-small text-ink-faint">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-body text-ink">{stop.name}</span>
                  {proposal.stops.length > 1 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeStop(stop.id)}
                    >
                      Remover
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>

            <div className="px-4 py-4">
              <Field label="Nome da viagem">
                {(fieldProps) => (
                  <Input
                    {...fieldProps}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Serra do Rio do Rastro"
                  />
                )}
              </Field>
            </div>
          </section>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-line p-3">
        {proposal ? (
          <div className="flex flex-col gap-2">
            <Button
              variant="solid"
              className="w-full"
              disabled={pending}
              onClick={save}
            >
              {pending ? 'Salvando…' : 'Salvar viagem'}
            </Button>
            {!isManual ? (
              <Button
                variant="ghost"
                className="w-full"
                disabled={pending}
                onClick={propose}
              >
                Propor outra volta
              </Button>
            ) : null}
          </div>
        ) : (
          <Button
            variant="solid"
            className="w-full"
            disabled={pending || isManual}
            onClick={propose}
          >
            {pending ? 'Montando…' : 'Propor roteiro'}
          </Button>
        )}
      </div>
    </div>
  )
}
