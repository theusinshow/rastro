import type { Coordinates } from '@/domain/geo'
import type {
  CommonsClient,
  CommonsMatch,
  CommonsPhoto,
} from './commons-client'

const ENDPOINT = 'https://commons.wikimedia.org/w/api.php'

/**
 * Raio da busca.
 *
 * 3 km é o compromisso: um mirante ou uma cachoeira raramente têm foto a menos
 * de 500 m, e acima disso começam a entrar fotos da cidade vizinha que não têm
 * nada a ver com o lugar.
 */
const RADIUS_M = 3000

const LIMIT = 12

/** Largura da miniatura que o próprio Commons gera. */
const THUMB_WIDTH = 480

/** Busca lenta não pode segurar a abertura do painel. */
const TIMEOUT_MS = 6000

interface CommonsPage {
  title?: unknown
  imageinfo?: {
    thumburl?: unknown
    descriptionurl?: unknown
    extmetadata?: {
      Artist?: { value?: unknown }
      LicenseShortName?: { value?: unknown }
    }
  }[]
  coordinates?: { dist?: unknown }[]
}

/** O Commons devolve o autor como HTML. Aqui vira texto simples. */
function toPlainText(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
  return text.length > 0 ? text.slice(0, 120) : null
}

function toPhoto(page: CommonsPage, match: CommonsMatch): CommonsPhoto | null {
  const info = page.imageinfo?.[0]
  const title = page.title
  if (typeof title !== 'string') return null
  if (typeof info?.thumburl !== 'string') return null
  if (typeof info.descriptionurl !== 'string') return null

  const distance = page.coordinates?.[0]?.dist
  return {
    match,
    id: title,
    // O nome do arquivo é o que o Commons tem de descrição garantida, e é o
    // único jeito de quem olha julgar se a foto achada pelo NOME é do lugar.
    title: title.replace(/^File:/, '').replace(/\.[a-z0-9]+$/i, ''),
    thumbnailUrl: info.thumburl,
    descriptionUrl: info.descriptionurl,
    author: toPlainText(info.extmetadata?.Artist?.value),
    license: toPlainText(info.extmetadata?.LicenseShortName?.value),
    distanceM:
      match === 'coordenada' && typeof distance === 'number'
        ? Math.round(distance)
        : null,
  }
}

function readPages(body: unknown): CommonsPage[] {
  const pages = (body as { query?: { pages?: Record<string, CommonsPage> } })
    ?.query?.pages
  return pages ? Object.values(pages) : []
}

/** Sem licença nomeada a foto não pode ser mostrada. É condição, não enfeite. */
function usable(photo: CommonsPhoto | null): photo is CommonsPhoto {
  return photo !== null && photo.license !== null
}

/** Parâmetros comuns às duas buscas. O que muda é só o gerador. */
function baseQuery(): URL {
  const url = new URL(ENDPOINT)
  url.searchParams.set('action', 'query')
  url.searchParams.set('format', 'json')
  url.searchParams.set('origin', '*')
  url.searchParams.set('prop', 'imageinfo|coordinates')
  // `extmetadata` é o que traz autor e licença — obrigação da licença CC, não
  // enfeite. Sem eles a foto não pode ser exibida.
  url.searchParams.set('iiprop', 'url|extmetadata')
  url.searchParams.set('iiurlwidth', String(THUMB_WIDTH))
  return url
}

async function query(url: URL): Promise<CommonsPage[]> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      // O Commons pede identificação de quem consulta.
      'Api-User-Agent': 'Rastro/1.0 (projeto pessoal; mapa de viagem)',
    },
  })
  if (!response.ok) return []
  return readPages(await response.json())
}

export function createCommonsClient(): CommonsClient {
  return {
    async forPlace(point: Coordinates, name: string) {
      try {
        const porCoordenada = baseQuery()
        // `generator=geosearch` limitado ao namespace 6 (Arquivo): sem isso
        // vêm artigos, não imagens.
        porCoordenada.searchParams.set('generator', 'geosearch')
        porCoordenada.searchParams.set(
          'ggscoord',
          `${point.latitude}|${point.longitude}`,
        )
        porCoordenada.searchParams.set('ggsradius', String(RADIUS_M))
        porCoordenada.searchParams.set('ggslimit', String(LIMIT))
        porCoordenada.searchParams.set('ggsnamespace', '6')
        porCoordenada.searchParams.set(
          'codistancefrompoint',
          `${point.latitude}|${point.longitude}`,
        )

        const porNome = baseQuery()
        porNome.searchParams.set('generator', 'search')
        // `filetype:bitmap` corta SVG, mapa e diagrama, que casam com o nome do
        // município e não mostram o lugar.
        porNome.searchParams.set('gsrsearch', `filetype:bitmap ${name}`)
        porNome.searchParams.set('gsrnamespace', '6')
        porNome.searchParams.set('gsrlimit', String(LIMIT))

        // As duas em paralelo: uma busca não depende da outra, e somar as
        // latências dobraria a espera do painel por nada.
        const [coordenadas, nomes] = await Promise.all([
          query(porCoordenada).catch(() => []),
          query(porNome).catch(() => []),
        ])

        const porId = new Map<string, CommonsPhoto>()

        // Coordenada primeiro, e por distância: quando o mesmo arquivo aparece
        // nas duas buscas, o que vale é a versão com distância — ela afirma
        // mais, e afirma com base em dado do próprio arquivo.
        for (const photo of coordenadas
          .map((page) => toPhoto(page, 'coordenada'))
          .filter(usable)
          .sort((a, b) => (a.distanceM ?? 0) - (b.distanceM ?? 0))) {
          porId.set(photo.id, photo)
        }

        for (const photo of nomes.map((page) => toPhoto(page, 'nome')).filter(usable)) {
          if (!porId.has(photo.id)) porId.set(photo.id, photo)
        }

        return [...porId.values()].slice(0, LIMIT * 2)
      } catch {
        // Rede, timeout, JSON inválido: lista vazia, e o painel não mostra a
        // seção. Foto de terceiro é enfeite; o lugar existe sem ela.
        return []
      }
    },
  }
}
