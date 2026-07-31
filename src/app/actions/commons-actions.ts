'use server'

import { getCommonsClient } from '@/lib/photos'
import type { CommonsPhoto } from '@/lib/photos'

/**
 * Fotografias do Wikimedia Commons tiradas perto de um ponto.
 *
 * Roda no servidor para que o `Api-User-Agent` que o Commons pede seja enviado
 * de verdade — o navegador não deixa definir esse cabeçalho.
 *
 * Nunca lança: sem resultado ou com o serviço fora, devolve `[]` e o painel
 * simplesmente não mostra a seção.
 */
export async function nearbyPhotosAction(
  latitude: number,
  longitude: number,
): Promise<CommonsPhoto[]> {
  return getCommonsClient().nearby({ latitude, longitude })
}
