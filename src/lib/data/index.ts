import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { PlaceRepository } from './place-repository'
import { createSupabasePlaceRepository } from './supabase/supabase-place-repository'

/**
 * Repositório de leitura desta requisição.
 *
 * Função, e não constante, porque o adapter carrega a sessão da requisição. Um
 * singleton de módulo compartilharia sessão entre usuários.
 *
 * O adapter em memória deixou de ser alcançável em tempo de execução: ele existe
 * só como fixture dos testes de domínio. Cair nele quando o Supabase não está
 * configurado esconderia exatamente o defeito que importa enxergar — uma
 * aplicação que aceita "Marcar visitado" e não grava nada.
 */
export async function getPlaceRepository(): Promise<PlaceRepository> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('sem sessão: o middleware deveria ter redirecionado')
  }

  return createSupabasePlaceRepository(supabase, user.id)
}

export type { PlaceRepository }
