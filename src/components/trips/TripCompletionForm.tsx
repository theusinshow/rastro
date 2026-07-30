'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { completeTripAction } from '@/app/actions/trip-actions'
import type { TripDetail } from '@/domain/trip'
import { Button } from '@/components/ui/Button'
import { InlineMessage } from '@/components/ui/InlineMessage'

interface TripCompletionFormProps {
  trip: TripDetail
}

export function TripCompletionForm({ trip }: TripCompletionFormProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Parada sem `placeId` não entra: combustível e almoço não são lugares do
  // catálogo e não viram memória no mapa.
  const catalogStops = trip.stops.filter((stop) => stop.placeId !== null)

  // Todas marcadas por padrão: o caso comum é a viagem ter acontecido como
  // planejada, e o trabalho do usuário é apontar a exceção, não confirmar o óbvio.
  const [confirmed, setConfirmed] = useState<string[]>(
    catalogStops.map((stop) => stop.id),
  )

  function toggle(id: string) {
    setConfirmed((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      const result = await completeTripAction(trip.id, confirmed)
      if (!result.ok) {
        setError(result.message)
        return
      }
      router.push(`/viagens/${trip.slug}`)
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-line px-5 py-4">
          <span className="instrument-label">Concluir</span>
          <h2 className="type-title mt-1.5 text-title text-ink">{trip.title}</h2>
          <p className="mt-2 text-body leading-relaxed text-ink-muted">
            Desmarque o que não aconteceu. Só o que ficar marcado vira visita
            registrada, e é o que muda a cor do pin no mapa.
          </p>
        </div>

        <ul>
          {catalogStops.map((stop) => (
            <li key={stop.id} className="border-b border-line">
              <label className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-overlay">
                <input
                  type="checkbox"
                  checked={confirmed.includes(stop.id)}
                  onChange={() => toggle(stop.id)}
                  className="size-5 shrink-0 accent-accent"
                />
                <span className="text-body text-ink">{stop.label}</span>
              </label>
            </li>
          ))}
        </ul>

        {error ? (
          <div className="px-5 py-4">
            <InlineMessage tone="error">{error}</InlineMessage>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 border-t border-line p-3">
        {/*
          NÃO desabilitar por lista vazia. Você rodou e tudo estava fechado —
          isso é um fato, e o produto não vai discutir com ele. Viagem concluída
          sem nenhuma visita é informação válida.
        */}
        <Button
          variant="solid"
          className="w-full"
          disabled={pending}
          onClick={submit}
        >
          {pending ? 'Concluindo…' : 'Concluir viagem'}
        </Button>
        <Link
          href={`/viagens/${trip.slug}`}
          className="press mt-2 flex h-12 items-center justify-center rounded-md
                     text-body font-medium text-ink-muted hover:bg-overlay
                     hover:text-ink"
        >
          Cancelar
        </Link>
      </div>
    </div>
  )
}
