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
import { Input } from '@/components/ui/Field'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { SectionHeader } from '@/components/ui/Section'
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
      <SectionHeader
        label="Visitas"
        hint={place.visits.length === 0 ? 'nenhuma registrada' : undefined}
      />

      {place.visits.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {place.visits.map((visit) => (
            <li key={visit.id} className="flex items-center gap-3">
              <Input
                numeric
                type="date"
                defaultValue={visit.visitedAt}
                max={today()}
                aria-label={`Data da visita de ${formatVisitDate(visit.visitedAt)}`}
                onChange={(event) =>
                  run(() => updateVisitDateAction(visit.id, event.target.value))
                }
                className="w-auto flex-1"
              />
              <Button
                variant="danger"
                size="sm"
                onClick={() => run(() => removeVisitAction(visit.id))}
              >
                Remover
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <Button
        variant="outline"
        className="mt-3 w-full"
        disabled={pending}
        onClick={() => run(() => recordVisitAction(place.id, today()))}
      >
        Registrar visita hoje
      </Button>

      {error ? (
        <InlineMessage tone="error" className="mt-3">
          {error}
        </InlineMessage>
      ) : null}
    </div>
  )
}
