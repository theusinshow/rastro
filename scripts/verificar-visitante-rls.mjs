/**
 * Prova que o visitante nao sobe fotografia, e que quem tem conta continua
 * subindo.
 *
 * As DUAS metades importam. Um teste que so verificasse as recusas passaria
 * feliz com uma politica que barra todo mundo -- e o `coalesce` da migration
 * 0008 existe exatamente para isso nao acontecer: sem ele, a claim ausente de
 * quem entrou por provedor viraria `null`, e `null` e negacao. Por isso as
 * quatro combinacoes: duas identidades x dois alvos.
 *
 * Usa APENAS a chave anon, como os outros dois roteiros. A service_role nao
 * entra neste repositorio: o que protege o dado e a politica, nao o segredo da
 * chave.
 *
 * A identidade "com conta" e a credencial de RASTRO_DEV_LOGIN_*, a mesma da
 * entrada de desenvolvimento. Nao e um desvio: e uma conta de verdade, com
 * senha verificada pelo Supabase, e do ponto de vista do JWT ela e igual a uma
 * conta do Google -- sem a claim `is_anonymous`, que e tudo que a politica le.
 *
 * Uso: node scripts/verificar-visitante-rls.mjs
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const at = l.indexOf('=')
      return [l.slice(0, at).trim(), l.slice(at + 1).trim()]
    }),
)

function cliente() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // Sessoes separadas por cliente: os dois vivem ao mesmo tempo neste
    // processo, e um armazenamento compartilhado faria o segundo login
    // sobrescrever o primeiro no meio do roteiro.
    { auth: { persistSession: false } },
  )
}

let falhou = false

function ok(mensagem) {
  console.log('OK:', mensagem)
}

function falha(mensagem) {
  console.error('FALHOU:', mensagem)
  falhou = true
}

/** Recusa por RLS, e nao por qualquer outro motivo. */
function recusouPorRls(erro) {
  if (!erro) return false
  return (
    erro.code === '42501' ||
    /row-level security|violates row-level/i.test(erro.message ?? '')
  )
}

// ---------------------------------------------------------------- preparacao

// Um lugar do catalogo publico. `photos.place_id` e NOT NULL desde a 0004, e
// inventar um id daria erro de chave estrangeira -- que passaria por "recusado"
// sem a RLS ter opinado nada.
const publico = cliente()
const { data: lugares, error: erroLugares } = await publico
  .from('places')
  .select('id')
  .limit(1)

if (erroLugares || !lugares?.length) {
  console.error(
    'INCONCLUSIVO: nenhum lugar no catalogo. Aplique supabase/seeds/0001_places.sql.',
  )
  process.exit(1)
}
const PLACE_ID = lugares[0].id

// ------------------------------------------------------------- 1. visitante

const visitante = cliente()
const { data: sessaoVisitante, error: erroEntrada } =
  await visitante.auth.signInAnonymously()

if (erroEntrada) {
  console.error(
    'INCONCLUSIVO: a entrada de visitante nao esta ligada ->',
    erroEntrada.message,
    '\nLigue em Authentication -> Sign In / Providers -> Allow anonymous sign-ins.',
  )
  process.exit(1)
}

const UID_VISITANTE = sessaoVisitante.user.id

if (sessaoVisitante.user.is_anonymous !== true) {
  falha('a sessao de visitante nao veio marcada como anonima')
}

// 1a. Storage, na PROPRIA pasta. O caminho e legitimo de proposito: se usasse a
// pasta de outro, a recusa poderia vir da politica antiga (fotos_insert_own) e
// nada teria sido provado sobre a nova.
const { error: erroUploadVisitante } = await visitante.storage
  .from('fotos')
  .upload(`${UID_VISITANTE}/${PLACE_ID}/teste.jpg`, new Blob(['x']), {
    contentType: 'image/jpeg',
  })

if (!erroUploadVisitante) {
  falha('visitante subiu arquivo para o bucket fotos')
  await visitante.storage
    .from('fotos')
    .remove([`${UID_VISITANTE}/${PLACE_ID}/teste.jpg`])
} else if (/bucket not found/i.test(erroUploadVisitante.message)) {
  console.error('INCONCLUSIVO: o bucket nao existe. Aplique a migration 0005.')
  process.exit(1)
} else {
  ok(`visitante nao sobe arquivo -> ${erroUploadVisitante.message}`)
}

// 1b. Linha em `photos`, tambem em nome proprio.
const { error: erroLinhaVisitante } = await visitante.from('photos').insert({
  user_id: UID_VISITANTE,
  place_id: PLACE_ID,
  storage_path: `${UID_VISITANTE}/${PLACE_ID}/teste.jpg`,
  width: 100,
  height: 100,
})

if (recusouPorRls(erroLinhaVisitante)) {
  ok(`visitante nao grava linha em photos -> ${erroLinhaVisitante.message}`)
} else if (!erroLinhaVisitante) {
  falha('visitante gravou linha em photos')
} else {
  falha(
    `visitante recusado em photos pelo motivo errado -> ${erroLinhaVisitante.code} ${erroLinhaVisitante.message}`,
  )
}

// 1c. O visitante NAO esta trancado fora do produto. Sem esta verificacao, uma
// sessao completamente quebrada passaria nas duas anteriores.
const { error: erroEstado } = await visitante
  .from('place_user_states')
  .upsert({ user_id: UID_VISITANTE, place_id: PLACE_ID, is_favorite: true })

if (erroEstado) {
  falha(`visitante nao conseguiu favoritar -> ${erroEstado.message}`)
} else {
  ok('visitante favorita normalmente (a sessao e real, so a foto e fechada)')
}

// ------------------------------------------------------------- 2. com conta

if (!env.RASTRO_DEV_LOGIN_EMAIL || !env.RASTRO_DEV_LOGIN_PASSWORD) {
  console.error(
    'INCONCLUSIVO: RASTRO_DEV_LOGIN_EMAIL/PASSWORD ausentes em .env.local.',
    '\nSem a metade "com conta" este roteiro nao prova o coalesce da 0008.',
  )
  process.exit(1)
}

const comConta = cliente()
const { data: sessaoConta, error: erroSenha } =
  await comConta.auth.signInWithPassword({
    email: env.RASTRO_DEV_LOGIN_EMAIL,
    password: env.RASTRO_DEV_LOGIN_PASSWORD,
  })

if (erroSenha) {
  console.error('INCONCLUSIVO: a conta de desenvolvimento nao entrou ->', erroSenha.message)
  process.exit(1)
}

const UID_CONTA = sessaoConta.user.id
const CAMINHO_CONTA = `${UID_CONTA}/${PLACE_ID}/verificacao-visitante.jpg`

// 2a. Storage. Esta e a metade que prova o coalesce.
const { error: erroUploadConta } = await comConta.storage
  .from('fotos')
  .upload(CAMINHO_CONTA, new Blob(['x']), { contentType: 'image/jpeg' })

if (erroUploadConta) {
  falha(
    `quem tem conta NAO subiu arquivo -> ${erroUploadConta.message}` +
      '\n       Provavel coalesce faltando na politica fotos_insert_nao_visitante.',
  )
} else {
  ok('quem tem conta sobe arquivo normalmente')
  await comConta.storage.from('fotos').remove([CAMINHO_CONTA])
}

// 2b. Linha em `photos`.
const { data: linhaConta, error: erroLinhaConta } = await comConta
  .from('photos')
  .insert({
    user_id: UID_CONTA,
    place_id: PLACE_ID,
    storage_path: CAMINHO_CONTA,
    width: 100,
    height: 100,
  })
  .select('id')
  .single()

if (erroLinhaConta) {
  falha(
    `quem tem conta NAO gravou linha em photos -> ${erroLinhaConta.message}` +
      '\n       Provavel coalesce faltando na politica photos_insert_nao_visitante.',
  )
} else {
  ok('quem tem conta grava linha em photos normalmente')
  // A linha sai; o trigger de photo_count acerta a contagem sozinho na volta.
  await comConta.from('photos').delete().eq('id', linhaConta.id)
}

// ------------------------------------------------------------------ faxina

// O favorito do visitante sai junto. A LINHA de auth.users dele fica -- e essa
// acumulacao e conhecida e esperada, com o SQL de faxina em VERIFICACAO-RLS.md.
await visitante
  .from('place_user_states')
  .delete()
  .eq('user_id', UID_VISITANTE)
  .eq('place_id', PLACE_ID)

console.log(
  falhou
    ? '\nRoteiro do visitante FALHOU.'
    : '\nRoteiro do visitante passou nas quatro combinacoes.',
)

process.exit(falhou ? 1 : 0)
