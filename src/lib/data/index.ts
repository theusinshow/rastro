import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { PlaceRepository } from './place-repository'
import type { PlaceStateRepository } from './place-state-repository'
import type { ProfileRepository } from './profile-repository'
import { createSupabasePlaceRepository } from './supabase/supabase-place-repository'
import { createSupabasePlaceStateRepository } from './supabase/supabase-place-state-repository'
import { createSupabaseProfileRepository } from './supabase/supabase-profile-repository'

/**
 * Cliente e usuário desta requisição.
 *
 * Os repositórios são funções, e não constantes, porque carregam a sessão da
 * requisição. Um singleton de módulo compartilharia sessão entre usuários.
 *
 * O adapter em memória deixou de ser alcançável em tempo de execução: ele existe
 * só como fixture dos testes de domínio. Cair nele quando o Supabase não está
 * configurado esconderia exatamente o defeito que importa enxergar — uma
 * aplicação que aceita "Marcar visitado" e não grava nada.
 */
async function sessionContext() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('sem sessão: o middleware deveria ter redirecionado')
  }

  return { supabase, userId: user.id }
}

export async function getPlaceRepository(): Promise<PlaceRepository> {
  const { supabase, userId } = await sessionContext()
  return createSupabasePlaceRepository(supabase, userId)
}

export async function getPlaceStateRepository(): Promise<PlaceStateRepository> {
  const { supabase, userId } = await sessionContext()
  return createSupabasePlaceStateRepository(supabase, userId)
}

export async function getProfileRepository(): Promise<ProfileRepository> {
  const { supabase, userId } = await sessionContext()
  return createSupabaseProfileRepository(supabase, userId)
}

export type { PlaceRepository, PlaceStateRepository, ProfileRepository }
