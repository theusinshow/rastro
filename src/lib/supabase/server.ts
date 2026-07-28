import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { readSupabaseConfig } from './config'

/**
 * Cliente por requisição. Nunca um singleton de módulo: ele carrega a sessão do
 * usuário desta requisição, e compartilhá-lo entre requisições vazaria dado
 * entre usuários.
 *
 * Não existe cliente equivalente para o navegador nesta aplicação, e é
 * deliberado: o login é iniciado por Server Action, então `supabase-js` fica
 * inteiro fora do bundle do cliente.
 */
export async function createServerSupabaseClient() {
  const config = readSupabaseConfig(process.env)
  if (!config) {
    throw new Error(
      'Supabase não configurado: defina NEXT_PUBLIC_SUPABASE_URL e ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY em .env.local',
    )
  }

  const cookieStore = await cookies()

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(items) {
        try {
          for (const item of items) {
            cookieStore.set(item.name, item.value, item.options)
          }
        } catch {
          // Server Components não podem escrever cookie. O middleware renova a
          // sessão antes de chegar aqui, então engolir é correto — e não engolir
          // derrubaria toda leitura de página com um erro que não é erro.
        }
      },
    },
  })
}

/** Se a aplicação tem como falar com o banco. Lido pelas páginas. */
export function isSupabaseConfigured(): boolean {
  return readSupabaseConfig(process.env) !== null
}
