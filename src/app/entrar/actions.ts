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

export async function signOutAction(): Promise<void> {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/entrar')
}
