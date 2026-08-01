/**
 * Busca uma foto de capa no Wikimedia Commons para cada lugar do catalogo e
 * GERA UM ARQUIVO SQL. Nao escreve no banco.
 *
 * Nao escreve porque nao pode, e isso e por desenho: a politica `places_update`
 * so deixa alterar lugar que voce criou (`created_by = auth.uid()`), e os
 * lugares curados tem `created_by` nulo. A chave anon nao os alcanca, e a
 * service_role nao entra neste repositorio (ADR 0008).
 *
 * Entao o script faz o que a aplicacao faria e para na fronteira: entrega SQL
 * para rodar no SQL Editor, como toda migration deste projeto. A RLS continua
 * sendo a fronteira, e a escrita continua sendo um ato deliberado.
 *
 * Uso: node scripts/fotos-de-capa.mjs
 * Saida: supabase/seeds/0002_fotos_de_capa.sql
 */
import { readFileSync, writeFileSync } from 'node:fs'
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

/**
 * Uma pausa entre requisicoes.
 *
 * O Commons corta quem dispara em rajada -- e cortou, na primeira vez que medi
 * a cobertura: nove lugares apareceram como "sem foto" que na verdade tinham.
 * Ler bloqueio como ausencia daria um catalogo pela metade sem nenhum erro na
 * tela. Um segundo e meio entre chamadas resolve.
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const INTERVALO_MS = 1500

/** Tira a marcacao HTML que o Commons devolve nos campos de credito. */
function limparHtml(valor) {
  if (typeof valor !== 'string') return null
  const texto = valor
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
  return texto.length > 0 ? texto.slice(0, 180) : null
}

function aspas(valor) {
  if (valor === null || valor === undefined) return 'null'
  return `'${String(valor).replace(/'/g, "''")}'`
}

async function buscarFoto(termo) {
  const url = new URL('https://commons.wikimedia.org/w/api.php')
  url.searchParams.set('action', 'query')
  url.searchParams.set('format', 'json')
  url.searchParams.set('generator', 'search')
  url.searchParams.set('gsrnamespace', '6')
  url.searchParams.set('gsrsearch', `filetype:bitmap ${termo}`)
  url.searchParams.set('gsrlimit', '5')
  url.searchParams.set('prop', 'imageinfo')
  url.searchParams.set('iiprop', 'url|extmetadata|size')
  url.searchParams.set('iiurlwidth', '1600')

  try {
    const resposta = await fetch(url, {
      headers: { 'Api-User-Agent': 'Rastro/1.0 (projeto pessoal; mapa de viagem)' },
      signal: AbortSignal.timeout(20_000),
    })
    if (!resposta.ok) return null

    const corpo = await resposta.json()
    const paginas = Object.values(corpo?.query?.pages ?? {})

    // A de maior largura entre as candidatas: a capa e vista grande, e uma
    // miniatura esticada denuncia amadorismo antes de qualquer outra coisa.
    const melhor = paginas
      .map((p) => p?.imageinfo?.[0])
      .filter((i) => i?.thumburl)
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]

    if (!melhor) return null

    const meta = melhor.extmetadata ?? {}
    return {
      url: melhor.thumburl,
      autor: limparHtml(meta.Artist?.value),
      licenca: limparHtml(meta.LicenseShortName?.value),
      origem: melhor.descriptionurl ?? null,
    }
  } catch {
    return null
  }
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
)

const { data: lugares, error } = await supabase
  .from('places')
  .select('slug, name, municipality')
  .order('name')

if (error || !lugares) {
  console.error('Nao foi possivel ler o catalogo:', error?.message)
  process.exit(1)
}

const linhas = []
let achadas = 0
let semCredito = 0

for (const lugar of lugares) {
  // Duas tentativas: nome com municipio, e nome sozinho. A segunda existe para
  // o caso de o lugar e o municipio terem o mesmo nome -- "Garopaba Garopaba"
  // nao casa com nada, e Garopaba tem fotos.
  let foto = await buscarFoto(`${lugar.name} ${lugar.municipality}`)
  if (!foto) {
    await sleep(INTERVALO_MS)
    foto = await buscarFoto(lugar.name)
  }

  if (!foto) {
    console.log(`  SEM FOTO  ${lugar.name}`)
    await sleep(INTERVALO_MS)
    continue
  }

  // Sem autor ou sem licenca a foto NAO entra. A licenca e condicional: sem
  // poder creditar, nao ha permissao para publicar.
  if (!foto.autor || !foto.licenca) {
    semCredito += 1
    console.log(`  SEM CREDITO  ${lugar.name} — descartada`)
    await sleep(INTERVALO_MS)
    continue
  }

  achadas += 1
  console.log(`  ok  ${lugar.name} — ${foto.licenca} — ${foto.autor.slice(0, 40)}`)
  linhas.push(
    `update places set\n` +
      `  cover_image_url     = ${aspas(foto.url)},\n` +
      `  cover_image_author  = ${aspas(foto.autor)},\n` +
      `  cover_image_license = ${aspas(foto.licenca)},\n` +
      `  cover_image_source  = ${aspas(foto.origem)}\n` +
      `where slug = ${aspas(lugar.slug)};`,
  )

  await sleep(INTERVALO_MS)
}

const cabecalho = `-- Fotos de capa do Wikimedia Commons.
--
-- GERADO por scripts/fotos-de-capa.mjs. Nao editar a mao: rode o script de novo.
--
-- Cada foto vem com autor, licenca e pagina de origem porque CC BY e CC BY-SA
-- OBRIGAM atribuir. Lugar sem credito completo foi descartado pelo script --
-- sem poder creditar, nao ha permissao para publicar.
--
-- ${achadas} de ${lugares.length} lugares com foto. ${semCredito} descartado(s) por credito incompleto.

`

writeFileSync('supabase/seeds/0002_fotos_de_capa.sql', cabecalho + linhas.join('\n\n') + '\n')

console.log(
  `\n${achadas} de ${lugares.length} com foto creditada.` +
    `\nSQL em supabase/seeds/0002_fotos_de_capa.sql — rode no SQL Editor.`,
)
