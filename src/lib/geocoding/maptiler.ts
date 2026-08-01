import type { GeocodedPlace, GeocodingClient } from './geocoding-client'

const ENDPOINT = 'https://api.maptiler.com/geocoding'

/** Busca lenta não pode travar quem está digitando. */
const TIMEOUT_MS = 5000

const MAX_RESULTS = 5

interface MapTilerFeature {
  place_name?: unknown
  text?: unknown
  center?: unknown
  context?: { text?: unknown }[]
}

function isLngLat(value: unknown): value is [number, number] {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    typeof value[0] === 'number' &&
    typeof value[1] === 'number'
  )
}

/**
 * `'Palhoça, Santa Catarina, Brasil'` → `'Palhoça, Santa Catarina'`.
 *
 * O país sai porque o produto é de Santa Catarina e repetir "Brasil" em toda
 * origem só gasta largura de painel.
 */
function toLabel(feature: MapTilerFeature): string {
  const full =
    typeof feature.place_name === 'string'
      ? feature.place_name
      : typeof feature.text === 'string'
        ? feature.text
        : ''

  const parts = full.split(',').map((part) => part.trim())
  return parts.slice(0, 2).join(', ') || full
}

export function createMapTilerGeocodingClient(apiKey: string): GeocodingClient {
  return {
    async search(query) {
      const trimmed = query.trim()
      if (trimmed.length < 3) return []

      try {
        const url = new URL(`${ENDPOINT}/${encodeURIComponent(trimmed)}.json`)
        url.searchParams.set('key', apiKey)
        // Enviesa para o Brasil e para o idioma: sem isto, "Palhoça" traz
        // resultados de Portugal antes do que o usuário quer.
        url.searchParams.set('country', 'br')
        url.searchParams.set('language', 'pt')
        url.searchParams.set('limit', String(MAX_RESULTS))

        const response = await fetch(url, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
        })
        if (!response.ok) return []

        const body: unknown = await response.json()
        const features = (body as { features?: MapTilerFeature[] })?.features
        if (!Array.isArray(features)) return []

        const out: GeocodedPlace[] = []
        for (const feature of features) {
          if (!isLngLat(feature.center)) continue
          const [longitude, latitude] = feature.center
          if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) continue
          out.push({ label: toLabel(feature), coordinates: { latitude, longitude } })
        }
        return out
      } catch {
        // Rede, timeout, JSON inválido: tudo vira lista vazia. Quem chama cai no
        // clique no mapa, que nunca depende de serviço nenhum.
        return []
      }
    },

    async reverse(coordinates) {
      try {
        // O MapTiler inverte a ordem: `lng,lat`, e não `lat,lng`. Trocar os dois
        // não dá erro — devolve um lugar no meio do oceano, calado.
        const ponto = `${coordinates.longitude},${coordinates.latitude}`
        const url = new URL(`${ENDPOINT}/${ponto}.json`)
        url.searchParams.set('key', apiKey)
        url.searchParams.set('language', 'pt')
        url.searchParams.set('limit', '1')

        const response = await fetch(url, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
        })
        if (!response.ok) return null

        const body: unknown = await response.json()
        const features = (body as { features?: MapTilerFeature[] })?.features
        const first = Array.isArray(features) ? features[0] : undefined
        if (!first) return null

        const label = toLabel(first)
        return label.length > 0 ? label : null
      } catch {
        return null
      }
    },
  }
}
