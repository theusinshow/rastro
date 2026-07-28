'use server'

import { revalidatePath } from 'next/cache'
import { getProfileRepository } from '@/lib/data'
import type { ActionResult } from './result'

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
