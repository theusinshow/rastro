import type { Viewer } from '@/domain/guest'
import { sessionContext } from './session'

/**
 * Quem está olhando, lido da sessão desta requisição.
 *
 * `is_anonymous` é a claim que o Supabase põe no JWT de quem entrou sem conta.
 * Ela vem opcional no tipo do usuário, e o `?? false` trata a ausência: para
 * quem entrou por provedor a claim simplesmente não existe.
 *
 * É a mesma leitura que as políticas restritivas da migration 0008 fazem do
 * outro lado, e as duas precisam concordar — se divergirem, a interface oferece
 * o envio de foto e o banco recusa.
 */
export async function getViewer(): Promise<Viewer> {
  const { user } = await sessionContext()
  return { isGuest: user.is_anonymous ?? false }
}
