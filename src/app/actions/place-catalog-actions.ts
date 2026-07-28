'use server'

import { revalidatePath } from 'next/cache'
import {
  PLACE_VALIDATION_MESSAGES,
  validateNewPlace,
  type NewPlace,
} from '@/domain/place'
import { slugify, uniqueSlug } from '@/domain/slug'
import { getPlaceCatalogRepository } from '@/lib/data'
import type { ActionResult } from './result'

export async function createPlaceAction(
  input: NewPlace,
): Promise<ActionResult & { slug?: string }> {
  // Primeiro erro só: o formulário mostra um problema por vez, e a validação já
  // roda inteira — os demais aparecem conforme cada um é corrigido.
  const [firstError] = validateNewPlace(input)
  if (firstError) {
    return { ok: false, message: PLACE_VALIDATION_MESSAGES[firstError] }
  }

  try {
    const repository = await getPlaceCatalogRepository()
    // A corrida entre `listSlugs` e `createPlace` é conhecida e aceita: um único
    // usuário não cria dois lugares no mesmo instante. Se acontecer, o índice
    // único de `slug` recusa e a mensagem aparece — o banco continua sendo a
    // autoridade.
    const taken = await repository.listSlugs()
    const slug = uniqueSlug(slugify(input.name), taken)
    const place = await repository.createPlace(input, slug)
    revalidatePath('/', 'layout')
    return { ok: true, slug: place.slug }
  } catch {
    return { ok: false, message: 'Não foi possível criar o lugar.' }
  }
}

export async function updatePlaceAction(
  id: string,
  input: NewPlace,
): Promise<ActionResult> {
  const [firstError] = validateNewPlace(input)
  if (firstError) {
    return { ok: false, message: PLACE_VALIDATION_MESSAGES[firstError] }
  }

  try {
    const repository = await getPlaceCatalogRepository()
    await repository.updatePlace(id, input)
  } catch {
    return { ok: false, message: 'Não foi possível salvar as alterações.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function deletePlaceAction(id: string): Promise<ActionResult> {
  try {
    const repository = await getPlaceCatalogRepository()
    await repository.deletePlace(id)
  } catch {
    return { ok: false, message: 'Não foi possível apagar o lugar.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}
