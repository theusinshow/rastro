import { describe, expect, it } from 'vitest'
import { readSupabaseConfig } from './config'

describe('readSupabaseConfig', () => {
  it('devolve a configuração quando as duas variáveis existem', () => {
    expect(
      readSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'chave',
      }),
    ).toEqual({ url: 'https://abc.supabase.co', anonKey: 'chave' })
  })

  it('devolve null quando falta a URL', () => {
    expect(
      readSupabaseConfig({ NEXT_PUBLIC_SUPABASE_ANON_KEY: 'chave' }),
    ).toBeNull()
  })

  it('devolve null quando falta a chave', () => {
    expect(
      readSupabaseConfig({ NEXT_PUBLIC_SUPABASE_URL: 'https://abc.supabase.co' }),
    ).toBeNull()
  })

  // Variável vazia é o caso real: `.env.example` copiado sem preencher.
  // Tratá-la como ausente é o que faz o estado de fallback aparecer em vez de um
  // erro de rede incompreensível.
  it('trata string vazia como ausente', () => {
    expect(
      readSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: 'chave',
      }),
    ).toBeNull()
  })

  it('ignora espaço em volta dos valores', () => {
    expect(
      readSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: '  https://abc.supabase.co  ',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ' chave ',
      }),
    ).toEqual({ url: 'https://abc.supabase.co', anonKey: 'chave' })
  })
})
