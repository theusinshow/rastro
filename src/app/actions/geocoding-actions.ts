'use server'

import { getGeocodingClient } from '@/lib/geocoding'
import type { GeocodedPlace } from '@/lib/geocoding'

/**
 * Busca um endereço e devolve candidatos.
 *
 * Roda no servidor por um motivo de produto, não de segredo: a chave do MapTiler
 * já é pública. É para que a tela de origem continue funcionando igual quando o
 * serviço não responde — lista vazia, e o clique no mapa segue disponível.
 *
 * Nunca lança: sem chave ou com o serviço fora, devolve `[]`.
 */
export async function searchAddressAction(
  query: string,
): Promise<GeocodedPlace[]> {
  const client = getGeocodingClient()
  if (!client) return []
  return client.search(query)
}
