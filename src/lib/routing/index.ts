import { createOpenRouteServiceClient } from './open-route-service'
import type { RoutingClient } from './routing-client'

/**
 * `null` quando não há chave configurada — e o produto continua funcionando em
 * modo estimado, do mesmo jeito que a tela de entrada lida com Supabase ausente.
 *
 * A variável NÃO tem prefixo `NEXT_PUBLIC_`, e isso é o ponto todo: a chamada ao
 * provedor acontece só no servidor, e a chave nunca chega ao navegador.
 */
export function getRoutingClient(): RoutingClient | null {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY
  if (!apiKey) return null
  return createOpenRouteServiceClient(apiKey)
}

export type { RoutedLine, RoutingClient } from './routing-client'
