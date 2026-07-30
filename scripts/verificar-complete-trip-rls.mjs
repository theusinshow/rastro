/**
 * Prova que `complete_trip` NÃO pode ser usada por quem não é dono da viagem.
 *
 * A função é `security invoker` justamente para isso: a RLS decide dentro dela.
 * Este script existe porque "confio que a RLS pega" não é verificação — e o
 * `docs/VERIFICACAO-RLS.md` nunca havia sido executado neste projeto.
 *
 * Usa APENAS a chave `anon`. A `service_role` não entra neste repositório: a
 * proteção do dado é a RLS, não o segredo da chave.
 *
 * Uso: node scripts/verificar-complete-trip-rls.mjs <uuid-de-uma-viagem>
 *
 * IMPORTANTE — passe o uuid de uma viagem que EXISTE. Com um uuid inventado a
 * função também recusa, mas por não encontrar a linha, e aí o script prova menos
 * do que parece: "zero linhas atualizadas" seria ambíguo entre "a RLS bloqueou" e
 * "a viagem não existe". Só com uma viagem real de outro dono a recusa vira prova
 * de autorização.
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
    .map((line) => {
      const at = line.indexOf('=')
      return [line.slice(0, at).trim(), line.slice(at + 1).trim()]
    }),
)

const url = env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const tripId = process.argv[2]

if (!url || !anonKey) {
  throw new Error('faltam NEXT_PUBLIC_SUPABASE_* em .env.local')
}
if (!tripId) {
  throw new Error('informe o uuid de uma viagem: node scripts/... <uuid>')
}

// Cliente anônimo: nenhuma sessão, logo `auth.uid()` é nulo dentro da função.
const anon = createClient(url, anonKey)

let falhou = false

const { error } = await anon.rpc('complete_trip', {
  p_trip_id: tripId,
  p_confirmed_stop_ids: [],
  p_visited_at: '2026-07-30',
})

if (!error) {
  console.error('FALHOU: anonimo concluiu a viagem. A funcao esta furada.')
  falhou = true
} else if (/does not exist|could not find the function|PGRST202/i.test(
  `${error.message} ${error.code ?? ''}`,
)) {
  // Distincao que importa: funcao ausente TAMBEM da erro, e contar isso como
  // "a RLS recusou" faria o teste passar pelo motivo errado -- que e pior que
  // nao ter teste. A migration 0003 precisa ter sido aplicada.
  console.error('INCONCLUSIVO: a funcao complete_trip nao existe no banco.')
  console.error('  ->', error.message)
  console.error('  aplique supabase/migrations/0003_complete_trip.sql')
  falhou = true
} else {
  console.log('OK: a funcao existe e recusou o anonimo ->', error.message)
}

const { data, error: readError } = await anon
  .from('trips')
  .select('id, status')
  .eq('id', tripId)

if (readError) {
  console.log('OK: anonimo nao le trips ->', readError.message)
} else if (data.length === 0) {
  console.log('OK: anonimo nao ve nenhuma viagem (RLS filtrou)')
} else {
  console.error('FALHOU: anonimo leu trips', data)
  falhou = true
}

process.exit(falhou ? 1 : 0)
