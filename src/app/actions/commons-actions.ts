'use server'

import { getCommonsClient } from '@/lib/photos'
import type { CommonsPhoto } from '@/lib/photos'

/**
 * Fotografias do Wikimedia Commons de um lugar.
 *
 * Recebe o NOME junto da coordenada porque as duas buscas são necessárias:
 * medido no catálogo real, quando ele tinha catorze lugares, dez não tinham
 * nenhuma foto geolocalizada — o litoral inteiro, incluindo a Lagoa da
 * Conceição. O catálogo cresceu desde então; a proporção é do dia da medição,
 * e a conclusão que ela sustenta não depende do tamanho.
 *
 * Roda no servidor para que o `Api-User-Agent` que o Commons pede seja enviado
 * de verdade — o navegador não deixa definir esse cabeçalho.
 *
 * Nunca lança: sem resultado ou com o serviço fora, devolve `[]` e o painel
 * simplesmente não mostra a seção.
 */
export async function placePhotosAction(
  latitude: number,
  longitude: number,
  name: string,
): Promise<CommonsPhoto[]> {
  return getCommonsClient().forPlace({ latitude, longitude }, name)
}
