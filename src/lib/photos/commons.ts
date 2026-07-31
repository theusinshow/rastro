import type { Coordinates } from '@/domain/geo'
import type { CommonsClient, CommonsPhoto } from './commons-client'

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

function toPhoto(page: CommonsPage): CommonsPhoto | null {
  const info = page.imageinfo?.[0]
  const title = page.title
  if (typeof title !== 'string') return null
  if (typeof info?.thumburl !== 'string') return null
  if (typeof info.descriptionurl !== 'string') return null

  const distance = page.coordinates?.[0]?.dist
  return {
    id: title,
    thumbnailUrl: info.thumburl,
    descriptionUrl: info.descriptionurl,
    author: toPlainText(info.extmetadata?.Artist?.value),
    license: toPlainText(info.extmetadata?.LicenseShortName?.value),
    distanceM: typeof distance === 'number' ? Math.round(distance) : 0,
  }
}

export function createCommonsClient(): CommonsClient {
  return {
    async nearby(point: Coordinates) {
      try {
        const url = new URL(ENDPOINT)
        url.searchParams.set('action', 'query')
        url.searchParams.set('format', 'json')
        url.searchParams.set('origin', '*')
        // `generator=geosearch` limitado ao namespace 6 (Arquivo): sem isso
        // vêm artigos, não imagens.
        url.searchParams.set('generator', 'geosearch')
        url.searchParams.set('ggscoord', `${point.latitude}|${point.longitude}`)
        url.searchParams.set('ggsradius', String(RADIUS_M))
        url.searchParams.set('ggslimit', String(LIMIT))
        url.searchParams.set('ggsnamespace', '6')
        url.searchParams.set('prop', 'imageinfo|coordinates')
        // `extmetadata` é o que traz autor e licença — obrigação da licença CC,
        // não enfeite. Sem eles a foto não pode ser exibida.
        url.searchParams.set('iiprop', 'url|extmetadata')
        url.searchParams.set('iiurlwidth', String(THUMB_WIDTH))
        url.searchParams.set('codistancefrompoint', `${point.latitude}|${point.longitude}`)

        const response = await fetch(url, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
          headers: {
            // O Commons pede identificação de quem consulta.
            'Api-User-Agent': 'Rastro/1.0 (projeto pessoal; mapa de viagem)',
          },
        })
        if (!response.ok) return []

        const body: unknown = await response.json()
        const pages = (body as { query?: { pages?: Record<string, CommonsPage> } })
          ?.query?.pages
        if (!pages) return []

        return Object.values(pages)
          .map(toPhoto)
          .filter((photo): photo is CommonsPhoto => photo !== null)
          // Sem licença nomeada a foto não pode ser mostrada: exibir obra de
          // terceiro sem a licença ao lado é o problema que esta fonte existe
          // para evitar.
          .filter((photo) => photo.license !== null)
          .sort((a, b) => a.distanceM - b.distanceM)
      } catch {
        // Rede, timeout, JSON inválido: lista vazia, e o painel não mostra a
        // seção. Foto de terceiro é enfeite; o lugar existe sem ela.
        return []
      }
    },
  }
}
