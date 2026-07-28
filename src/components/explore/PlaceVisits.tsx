'use client'

import { useState, useTransition } from 'react'
import { formatVisitDate } from '@/domain/dates'
import type { ExplorePlace } from '@/domain/place'
import {
  recordVisitAction,
  removeVisitAction,
  updateVisitDateAction,
} from '@/app/actions/place-state-actions'
import { Button } from '@/components/ui/Button'
import type { ActionResult } from '@/app/actions/result'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Histórico de passagens por um lugar.
 *
 * Registrar não devolve um estado, devolve uma linha: voltar acrescenta outra.
 * É a diferença entre uma chave e um evento, e é o que impede a interface de
 * oferecer "desmarcar visitado" — que só poderia ser implementado apagando
 * memória, num produto cuja tese é guardá-la.
 */
export function PlaceVisits({ place }: { place: ExplorePlace }) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      setError(null)
      const result = await action()
      if (!result.ok) setError(result.message)
    })
  }

  return (
    <div className="border-b border-line px-5 py-4">
      <span className="instrument-label">Visitas</span>

      {place.visits.length === 0 ? (
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
          Nenhuma visita registrada.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {place.visits.map((visit) => (
            <li key={visit.id} className="flex items-center gap-2">
              <input
                type="date"
                defaultValue={visit.visitedAt}
                max={today()}
                aria-label={`Data da visita de ${formatVisitDate(visit.visitedAt)}`}
                onChange={(event) =>
                  run(() => updateVisitDateAction(visit.id, event.target.value))
                }
                className="instrument-value rounded-xs border border-line bg-raised
                           px-1.5 py-1 text-[11px] text-ink"
              />
              <button
                type="button"
                onClick={() => run(() => removeVisitAction(visit.id))}
                className="ml-auto text-[10px] tracking-[0.14em] text-ink-faint
                           uppercase transition-colors hover:text-ink-muted"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <Button
        type="button"
        size="sm"
        variant="outline"
        className="mt-3 w-full"
        disabled={pending}
        onClick={() => run(() => recordVisitAction(place.id, today()))}
      >
        Registrar visita hoje
      </Button>

      {error ? (
        <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">{error}</p>
      ) : null}
    </div>
  )
}
