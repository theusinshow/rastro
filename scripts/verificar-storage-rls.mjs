/**
 * Prova que o bucket `fotos` e privado e que ninguem alcanca a pasta de outro.
 *
 * "Confio que a RLS pega" nao e verificacao. Existe pelo mesmo motivo do
 * verificar-complete-trip-rls.mjs.
 *
 * Usa APENAS a chave anon. A service_role nao entra neste repositorio: a
 * protecao do dado e a RLS, nao o segredo da chave.
 *
 * Uso: node scripts/verificar-storage-rls.mjs
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

const anon = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

let falhou = false
const PASTA_DE_OUTRO = '00000000-0000-0000-0000-000000000000'
const ALVO = `${PASTA_DE_OUTRO}/lugar/foto.jpg`

// 1. Listar a pasta de outro usuario.
const { data: lista, error: erroLista } = await anon.storage
  .from('fotos')
  .list(PASTA_DE_OUTRO)

if (erroLista) {
  console.log('OK: anonimo nao lista pasta de outro ->', erroLista.message)
} else if (lista.length === 0) {
  console.log('OK: anonimo nao ve nada na pasta de outro (RLS filtrou)')
} else {
  console.error('FALHOU: anonimo listou', lista)
  falhou = true
}

// 2. Escrever na pasta de outro usuario.
const { error: erroUpload } = await anon.storage
  .from('fotos')
  .upload(ALVO, new Blob(['x'], { type: 'text/plain' }))

if (!erroUpload) {
  console.error('FALHOU: anonimo escreveu na pasta de outro')
  falhou = true
} else if (/bucket not found/i.test(erroUpload.message)) {
  // Distincao que importa: bucket ausente tambem da erro, e contar isso como
  // "a RLS recusou" faria o teste passar pelo motivo errado.
  console.error('INCONCLUSIVO: o bucket nao existe. Aplique a migration 0005.')
  falhou = true
} else {
  console.log('OK: anonimo nao escreve ->', erroUpload.message)
}

// 3. A pergunta que decide se ha exposicao: a URL publica serve conteudo?
const { data: publica } = anon.storage.from('fotos').getPublicUrl(ALVO)
const resposta = await fetch(publica.publicUrl)

if (resposta.ok) {
  console.error('FALHOU: URL publica serviu o objeto. O bucket nao e privado.')
  falhou = true
} else {
  console.log('OK: URL publica recusada ->', resposta.status)
}

process.exit(falhou ? 1 : 0)
