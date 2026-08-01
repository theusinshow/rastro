'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function signInWithGoogleAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const origin = (await headers()).get('origin') ?? 'http://localhost:3000'
  const next = formData.get('proximo')
  const callback = new URL('/auth/callback', origin)
  if (typeof next === 'string' && next.startsWith('/')) {
    // Só caminho relativo. Aceitar URL absoluta aqui seria um redirecionamento
    // aberto: qualquer link poderia mandar a pessoa para fora depois de entrar.
    callback.searchParams.set('proximo', next)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: callback.toString() },
  })

  if (error || !data.url) {
    redirect('/entrar?erro=oauth')
  }

  // O fluxo PKCE guarda o verificador num cookie escrito pelo cliente de
  // servidor. É por isso que iniciar o login aqui, e não no navegador, mantém
  // `supabase-js` fora do bundle do cliente.
  redirect(data.url)
}

/**
 * Entrada de visitante: sessão anônima do Supabase.
 *
 * **Isto não é um desvio de autenticação.** O visitante recebe uma linha real em
 * `auth.users` e um `auth.uid()` próprio — é por isso que middleware,
 * repositórios e RLS funcionam sem nenhum caso especial. O que ele não recebe é
 * identidade: nada do que faz sobrevive à sessão, e as políticas restritivas da
 * migration 0008 recusam a única escrita que deixaria rastro permanente.
 *
 * Escrever a sessão aqui, e não no navegador, é a mesma decisão do login pelo
 * Google: mantém `supabase-js` fora do bundle do cliente. Ver ADR 0014 e 0017.
 */
export async function signInAsGuestAction(formData: FormData): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInAnonymously()

  if (error) {
    redirect(
      `/entrar?erro=visitante&detalhe=${encodeURIComponent(error.message)}`,
    )
  }

  const next = formData.get('proximo')
  // Só caminho relativo, e `//` fora: mesma proteção contra redirecionamento
  // aberto que `signInWithGoogleAction` faz acima.
  redirect(
    typeof next === 'string' && next.startsWith('/') && !next.startsWith('//')
      ? next
      : '/',
  )
}

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/entrar')
}
