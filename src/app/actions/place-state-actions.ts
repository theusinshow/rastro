'use server'

import { revalidatePath } from 'next/cache'
import { isValidRating, normalizeNote } from '@/domain/review'
import { getPlaceStateRepository } from '@/lib/data'
import type { ActionResult } from './result'

/** `YYYY-MM-DD`. É o formato que `<input type="date">` produz e que `date` aceita. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function checkDate(visitedAt: string): string | null {
  if (!ISO_DATE.test(visitedAt)) return 'Data inválida.'
  // Uma visita no futuro não é memória, é plano — e plano tem outro controle,
  // que é "quero conhecer".
  if (visitedAt > new Date().toISOString().slice(0, 10)) {
    return 'A data está no futuro.'
  }
  return null
}

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

export async function setWantsToVisitAction(
  placeId: string,
  value: boolean,
): Promise<ActionResult> {
  try {
    const repository = await getPlaceStateRepository()
    await repository.setWantsToVisit(placeId, value)
  } catch {
    return { ok: false, message: 'Não foi possível salvar. Tente de novo.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function recordVisitAction(
  placeId: string,
  visitedAt: string,
): Promise<ActionResult> {
  const invalid = checkDate(visitedAt)
  if (invalid) return { ok: false, message: invalid }

  try {
    const repository = await getPlaceStateRepository()
    await repository.recordVisit(placeId, visitedAt)
  } catch {
    return { ok: false, message: 'Não foi possível registrar a visita.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function updateVisitDateAction(
  visitId: string,
  visitedAt: string,
): Promise<ActionResult> {
  const invalid = checkDate(visitedAt)
  if (invalid) return { ok: false, message: invalid }

  try {
    const repository = await getPlaceStateRepository()
    await repository.updateVisitDate(visitId, visitedAt)
  } catch {
    return { ok: false, message: 'Não foi possível mudar a data.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}

/**
 * Como foi esta passagem: nota de 1 a 5 e relato.
 *
 * As duas são opcionais e independentes — dar nota sem escrever, ou escrever sem
 * dar nota, são usos legítimos. Exigir ambas transformaria a memória num
 * formulário.
 */
export async function updateVisitReviewAction(
  visitId: string,
  rating: number | null,
  notes: string | null,
): Promise<ActionResult> {
  if (!isValidRating(rating)) {
    return { ok: false, message: 'A nota precisa ser de 1 a 5.' }
  }

  try {
    const repository = await getPlaceStateRepository()
    await repository.updateVisitReview(visitId, rating, normalizeNote(notes))
  } catch {
    return { ok: false, message: 'Não foi possível salvar o relato.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function removeVisitAction(visitId: string): Promise<ActionResult> {
  try {
    const repository = await getPlaceStateRepository()
    await repository.removeVisit(visitId)
  } catch {
    return { ok: false, message: 'Não foi possível remover a visita.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}
