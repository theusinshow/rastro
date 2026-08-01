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

/**
 * Nome do lugar de uma coordenada. Serve à geolocalização do aparelho.
 *
 * Nunca lança e nunca bloqueia: sem nome, quem chama usa um rótulo genérico e
 * segue com a coordenada, que é o dado que a descoberta precisa. Perder o nome
 * é aceitável; perder a origem inteira porque um serviço não respondeu, não.
 */
export async function reverseGeocodeAction(
  latitude: number,
  longitude: number,
): Promise<string | null> {
  const client = getGeocodingClient()
  if (!client) return null
  return client.reverse({ latitude, longitude })
}
