/** Configuração mínima para falar com o projeto Supabase. */
export interface SupabaseConfig {
  url: string
  anonKey: string
}

function clean(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

/**
 * Lê a configuração do ambiente. `null` quando falta qualquer uma das duas.
 *
 * Recebe o ambiente como argumento em vez de ler `process.env` direto para
 * continuar sendo função pura e testável — o resto do projeto segue a mesma
 * regra com o domínio.
 *
 * Só a chave `anon` aparece aqui. A proteção do dado é a RLS, não o segredo da
 * chave; uma `service_role` neste arquivo contornaria toda a autorização.
 */
export function readSupabaseConfig(
  env: Record<string, string | undefined>,
): SupabaseConfig | null {
  const url = clean(env.NEXT_PUBLIC_SUPABASE_URL)
  const anonKey = clean(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (!url || !anonKey) return null
  return { url, anonKey }
}
