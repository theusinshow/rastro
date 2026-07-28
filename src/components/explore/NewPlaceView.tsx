'use client'

import { useRouter } from 'next/navigation'
import type { NewPlace } from '@/domain/place'
import { createPlaceAction } from '@/app/actions/place-catalog-actions'
import { PlaceForm } from './PlaceForm'
import { SELECTED_PLACE_PARAM } from './use-selected-place'

export function NewPlaceView() {
  const router = useRouter()

  async function submit(input: NewPlace) {
    const result = await createPlaceAction(input)
    if (result.ok && result.slug) {
      // Abrir o painel do lugar recém-criado é a confirmação mais forte de que
      // ele existe: o pin está no mapa e o painel mostra o que foi gravado.
      router.push(`/?${SELECTED_PLACE_PARAM}=${result.slug}`)
    }
    return result
  }

  return <PlaceForm picking submitLabel="Criar lugar" onSubmit={submit} />
}
