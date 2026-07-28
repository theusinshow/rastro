'use server'

import { revalidatePath } from 'next/cache'
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
