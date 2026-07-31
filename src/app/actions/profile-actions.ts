'use server'

import { revalidatePath } from 'next/cache'
import {
  MAX_AUTONOMY_KM,
  MIN_AUTONOMY_KM,
  isValidAutonomy,
} from '@/domain/fuel'
import { getProfileRepository } from '@/lib/data'
import type { ActionResult } from './result'

/**
 * Grava a autonomia da moto. `null` limpa.
 *
 * Limpar é operação legítima e não um erro: quem trocou de moto e ainda não
 * mediu a nova prefere que o produto pare de opinar a que ele opine com o número
 * da moto antiga.
 */
export async function setAutonomyAction(
  autonomyKm: number | null,
): Promise<ActionResult> {
  if (autonomyKm !== null && !isValidAutonomy(autonomyKm)) {
    return {
      ok: false,
      message: `A autonomia precisa ser um número inteiro entre ${MIN_AUTONOMY_KM} e ${MAX_AUTONOMY_KM} km.`,
    }
  }

  try {
    const repository = await getProfileRepository()
    await repository.setAutonomy(autonomyKm)
  } catch {
    return { ok: false, message: 'Não foi possível gravar a autonomia.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}

export async function setHomeAction(
  latitude: number,
  longitude: number,
  label: string,
): Promise<ActionResult> {
  const trimmed = label.trim()
  if (!trimmed) {
    return { ok: false, message: 'Dê um nome ao ponto de partida.' }
  }
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return { ok: false, message: 'A coordenada está fora de faixa.' }
  }

  try {
    const repository = await getProfileRepository()
    await repository.setHome({ latitude, longitude }, trimmed)
  } catch {
    return { ok: false, message: 'Não foi possível gravar a origem.' }
  }

  // `'layout'` porque a origem é lida no layout de `(app)` e alimenta toda a
  // árvore: revalidar só a rota atual deixaria a StatusBar desatualizada.
  revalidatePath('/', 'layout')
  return { ok: true }
}
