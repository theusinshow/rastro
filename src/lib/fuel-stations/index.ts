import { createGeoapifyFuelStationClient } from './geoapify'
import type { FuelStationClient } from './fuel-station-client'

/**
 * `null` quando não há chave configurada — e a interface diz isso, em vez de
 * ficar girando.
 *
 * A variável **não** tem prefixo `NEXT_PUBLIC_`, e isso é o ponto todo: a
 * chamada à Geoapify acontece só no servidor, atrás de `/api/fuel-stations`, e a
 * chave nunca entra no pacote entregue ao navegador. Mesmo desenho de
 * `getRoutingClient()`, pela mesma razão.
 *
 * Este módulo é a ÚNICA porta para o provedor. Um componente que importasse
 * `geoapify.ts` direto arrastaria a leitura de `process.env` para o cliente.
 */
export function getFuelStationClient(): FuelStationClient | null {
  const apiKey = process.env.GEOAPIFY_API_KEY
  if (!apiKey) return null
  return createGeoapifyFuelStationClient(apiKey)
}

export type { FuelStationClient } from './fuel-station-client'
