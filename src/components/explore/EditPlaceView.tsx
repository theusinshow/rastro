'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ExplorePlace, NewPlace } from '@/domain/place'
import {
  deletePlaceAction,
  updatePlaceAction,
} from '@/app/actions/place-catalog-actions'
import { Button } from '@/components/ui/Button'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { PlaceForm } from './PlaceForm'
import { SELECTED_PLACE_PARAM } from './use-selected-place'

/** "as 3 visitas registradas" / "a visita registrada" / string vazia. */
function visitsClause(count: number): string {
  if (count === 0) return ''
  if (count === 1) return ' remove junto a visita registrada'
  return ` remove junto as ${count} visitas registradas`
}

export function EditPlaceView({ place }: { place: ExplorePlace }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  async function submit(input: NewPlace) {
    const result = await updatePlaceAction(place.id, input)
    if (result.ok) {
      router.push(`/?${SELECTED_PLACE_PARAM}=${place.slug}`)
    }
    return result
  }

  function confirmDelete() {
    startTransition(async () => {
      setError(null)
      const result = await deletePlaceAction(place.id)
      if (result.ok) router.push('/')
      else setError(result.message)
    })
  }

  return (
    <PlaceForm
      // `picking={false}`: mudar a coordenada de um lugar existente é outra
      // operação. Aqui a coordenada original é preservada e apenas mostrada.
      picking={false}
      submitLabel="Salvar alterações"
      onSubmit={submit}
      initial={{
        name: place.name,
        description: place.description,
        latitude: place.latitude,
        longitude: place.longitude,
        municipality: place.municipality,
        category: place.category,
        tags: place.tags,
      }}
      footer={
        confirming ? (
          <div className="shrink-0 border-t border-line px-5 py-4">
            {/* Nomear as visitas é obrigatório: `place_visits` tem
                `on delete cascade` sobre `places`, então apagar o lugar apaga a
                memória junto. Esconder isso seria a pior omissão possível neste
                produto. */}
            <InlineMessage tone="warn">
              Apagar {place.name}
              {visitsClause(place.visits.length)}. Não há como desfazer.
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(false)}
              >
                Cancelar
              </Button>
            </div>
            {error ? (
              <InlineMessage tone="error" className="mt-3">
                {error}
              </InlineMessage>
            ) : null}
          </div>
        ) : (
          <div className="shrink-0 border-t border-line px-5 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConfirming(true)}
            >
              Apagar este lugar
            </Button>
          </div>
        )
      }
    />
  )
}
