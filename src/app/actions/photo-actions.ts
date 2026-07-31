'use server'

import { revalidatePath } from 'next/cache'
import {
  PHOTO_VALIDATION_MESSAGES,
  validateNewPhoto,
  type NewPhoto,
} from '@/domain/photo'
import { getPhotoRepository } from '@/lib/data'
import type { PhotoWithUrl } from '@/lib/data/photo-repository'
import type { ActionResult } from './result'

/**
 * Fotos de um lugar, já com URL assinada.
 *
 * Existe como action, e não como dado injetado pelo servidor, porque
 * `PlacePanel` é componente cliente: injetar exigiria reestruturar a árvore de
 * Explorar inteira para atravessar uma lista até o painel. Mesmo caminho do
 * `PlaceNearbyPhotos`, que é o componente irmão.
 *
 * Devolve `[]` em falha: um painel sem galeria é melhor que um painel quebrado.
 */
export async function listPhotosAction(
  placeId: string,
): Promise<PhotoWithUrl[]> {
  try {
    const repository = await getPhotoRepository()
    return await repository.listByPlace(placeId)
  } catch {
    return []
  }
}

/**
 * Grava a linha de uma foto que JÁ subiu para o Storage.
 *
 * O binário não passa por aqui: ele foi direto do navegador para o bucket, e
 * esta action só registra o que aconteceu. Ver ADR 0014.
 */
export async function addPhotoAction(input: NewPhoto): Promise<ActionResult> {
  const [firstError] = validateNewPhoto(input)
  if (firstError) {
    return { ok: false, message: PHOTO_VALIDATION_MESSAGES[firstError] }
  }

  try {
    const repository = await getPhotoRepository()
    await repository.addPhoto(input)
  } catch {
    return { ok: false, message: 'Não foi possível salvar a fotografia.' }
  }

  revalidatePath('/', 'layout')
  return { ok: true }
}

/**
 * Apaga a linha e devolve o caminho, para o cliente remover o objeto.
 *
 * A linha sai primeiro de propósito: arquivo órfão é desperdício, mas linha
 * apontando para arquivo inexistente é foto quebrada na tela.
 */
export async function deletePhotoAction(
  id: string,
): Promise<ActionResult & { storagePath?: string }> {
  try {
    const repository = await getPhotoRepository()
    const { storagePath } = await repository.deletePhoto(id)
    revalidatePath('/', 'layout')
    return { ok: true, storagePath }
  } catch {
    return { ok: false, message: 'Não foi possível apagar a fotografia.' }
  }
}
