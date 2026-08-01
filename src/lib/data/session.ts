import { cache } from 'react'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Cliente e usuário desta requisição.
 *
 * Os repositórios são funções, e não constantes, porque carregam a sessão da
 * requisição. Um singleton de módulo compartilharia sessão entre usuários.
 *
 * `cache` do React memoiza **por requisição**, e não entre requisições — a
 * sessão continua sendo de quem pediu. Sem ele, cada repositório de uma mesma
 * renderização paga uma ida à API de autenticação: uma página que lê lugares e
 * estado pessoal pagava duas, e o layout que lê perfil e visitante pagaria mais
 * duas. `getUser` valida o token contra o servidor de autenticação — e não
 * contra o cookie, que é falsificável —, então não é leitura barata.
 */
export const sessionContext = cache(async () => {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('sem sessão: o middleware deveria ter redirecionado')
  }

  return { supabase, user, userId: user.id }
})
