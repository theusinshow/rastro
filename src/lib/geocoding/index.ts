import { MAPTILER_KEY } from '@/lib/map/config'
import { createMapTilerGeocodingClient } from './maptiler'
import type { GeocodingClient } from './geocoding-client'

/**
 * `null` quando não há chave — e a interface cai no clique no mapa, que nunca
 * dependeu de serviço nenhum.
 *
 * Reaproveita a chave do MapTiler que o mapa já usa: mesmo fornecedor, mesma
 * origem de dados dos tiles, e nenhum cadastro novo. Ela é pública por natureza
 * (prefixo `NEXT_PUBLIC_`) e deve ser restringida por domínio no painel do
 * MapTiler — ver `src/lib/map/config.ts`.
 */
export function getGeocodingClient(): GeocodingClient | null {
  if (!MAPTILER_KEY) return null
  return createMapTilerGeocodingClient(MAPTILER_KEY)
}

export type { GeocodedPlace, GeocodingClient } from './geocoding-client'
