'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteTripAction } from '@/app/actions/trip-actions'
import type { TripDetail } from '@/domain/trip'
import { Button } from '@/components/ui/Button'
import { InlineMessage } from '@/components/ui/InlineMessage'

/**
 * Apagar uma viagem, com o custo nomeado antes.
 *
 * Componente cliente separado para que `TripItineraryView` continue no servidor:
 * a única coisa que precisa de estado aqui é o passo de confirmação.
 */
export function TripDeleteAction({ trip }: { trip: TripDetail }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const visitsRegistered = trip.stops.filter(
    (stop) => stop.arrivedAt !== null,
  ).length

  function confirmDelete() {
    startTransition(async () => {
      setError(null)
      const result = await deleteTripAction(trip.id)
      if (result.ok) router.push('/viagens')
      else setError(result.message)
    })
  }

  if (!confirming) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirming(true)}>
        Apagar esta viagem
      </Button>
    )
  }

  return (
    <div>
      {/*
        Dizer o que NÃO acontece é tão importante quanto dizer o que acontece.
        `place_visits.trip_id` é `on delete set null`: as visitas sobrevivem à
        viagem, e continuam pintando o mapa. Quem apaga uma viagem esperando
        desfazer a memória ficaria com o mapa dizendo outra coisa.
      */}
      <InlineMessage tone="warn">
        Apagar {trip.title} remove o roteiro e o traçado. Não há como desfazer.
        {visitsRegistered > 0
          ? visitsRegistered === 1
            ? ' A visita que ela registrou permanece no mapa.'
            : ` As ${visitsRegistered} visitas que ela registrou permanecem no mapa.`
          : ''}
      </InlineMessage>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          variant="danger"
          size="sm"
          disabled={pending}
          onClick={confirmDelete}
        >
          Apagar mesmo assim
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
          Cancelar
        </Button>
      </div>

      {error ? (
        <InlineMessage tone="error" className="mt-3">
          {error}
        </InlineMessage>
      ) : null}
    </div>
  )
}
