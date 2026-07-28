'use server'

import { revalidatePath } from 'next/cache'
import { getPlaceStateRepository } from '@/lib/data'
import type { ActionResult } from './result'

export async function setFavoriteAction(
  placeId: string,
  value: boolean,
): Promise<ActionResult> {
  try {
    const repository = await getPlaceStateRepository()
    await repository.setFavorite(placeId, value)
  } catch {
    return { ok: false, message: 'Não foi possível salvar. Tente de novo.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}
