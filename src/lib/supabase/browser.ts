'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { readSupabaseConfig } from './config'

let cached: SupabaseClient | null = null

/**
 * Primeiro cliente Supabase de navegador do projeto. Ver ADR 0014.
 *
 * **Existe por um motivo só: subir arquivo direto para o Storage.** Server
 * Actions do Next têm limite de corpo de 1 MB por padrão, e passar binário por
 * lá é frágil por construção — uma foto que o redimensionamento não encolha o
 * bastante quebraria.
 *
 * NÃO use para ler nem escrever tabela. Toda tabela continua atrás de Server
 * Action. A restrição está no ADR 0014 e existe para que esta porta não vire um
 * caminho paralelo ao resto da aplicação.
 *
 * `null` quando falta configuração, como o resto do projeto trata Supabase
 * ausente. Memoizado porque cada instância abre o próprio canal de auth.
 */
export function getBrowserSupabaseClient(): SupabaseClient | null {
  if (cached) return cached

  const config = readSupabaseConfig({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
  if (!config) return null

  cached = createBrowserClient(config.url, config.anonKey)
  return cached
}
