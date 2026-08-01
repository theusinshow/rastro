import type { FuelStation } from '@/domain/fuel-stations'
import type { FuelStationClient } from './fuel-station-client'

const ENDPOINT = 'https://api.geoapify.com/v2/places'

/**
 * A categoria de posto de combustível na árvore da Geoapify.
 *
 * Conferida na lista oficial de categorias suportadas, e não herdada de exemplo
 * de internet: sob `service.vehicle` existem `car_wash`, `charging_station`,
 * `fuel`, `repair` e `repair.motorcycle`. `service.vehicle.fuel` é a folha certa
 * — `service.vehicle` inteiro traria lava-jato e oficina junto.
 */
const FUEL_CATEGORY = 'service.vehicle.fuel'

/**
 * A busca acontece enquanto alguém olha o mapa esperando. Oito segundos é o que
 * separa "está vindo" de "não vem" — o mesmo prazo do roteador.
 */
const TIMEOUT_MS = 8000

/**
 * Posto não abre e fecha de hora em hora.
 *
 * Seis horas de cache no servidor é folgado de propósito: o dado vem do
 * OpenStreetMap, cuja edição de um posto em Santa Catarina acontece em escala de
 * semanas, e cada consulta ao provedor custa crédito. Encurtar isso gastaria
 * cota para receber exatamente a mesma resposta.
 */
const REVALIDATE_SECONDS = 21_600

/** Códigos do provedor que significam "a credencial é o problema". */
const UNAUTHORIZED = [401, 403]
/** Cota estourada, no padrão de HTTP. */
const TOO_MANY_REQUESTS = 429

interface GeoapifyFeature {
  geometry?: { coordinates?: unknown }
  properties?: Record<string, unknown>
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

/**
 * As tags cruas do OpenStreetMap, quando o provedor as devolve.
 *
 * `datasource.raw` não está na tabela de campos da documentação da Places API —
 * a tabela documenta `name`, endereço, `categories`, `distance` e `place_id`.
 * Por isso ele é lido como **opcional e desconhecido**, com narrowing em cada
 * campo: se o provedor parar de mandá-lo, os campos que dependem dele viram
 * `null` e a lista continua inteira, em vez de o `undefined` explodir três
 * camadas acima.
 */
function rawTags(properties: Record<string, unknown>): Record<string, unknown> {
  const datasource = properties.datasource
  if (typeof datasource !== 'object' || datasource === null) return {}
  const raw = (datasource as { raw?: unknown }).raw
  if (typeof raw !== 'object' || raw === null) return {}
  return raw as Record<string, unknown>
}

/**
 * O primeiro valor de texto que existir, entre o nível documentado e as tags
 * cruas.
 *
 * Bandeira e horário são o caso: `brand` e `opening_hours` são tags do
 * OpenStreetMap, e o provedor às vezes as promove ao topo do objeto e às vezes
 * as deixa só em `datasource.raw`. Ler os dois lugares é o que impede o horário
 * de sumir da tela por uma decisão de formato que não é nossa.
 */
function firstString(
  properties: Record<string, unknown>,
  raw: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = asString(properties[key]) ?? asString(raw[key])
    if (value !== null) return value
  }
  return null
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

/**
 * Traduz UMA feature. `null` a qualquer sinal de que ela não é utilizável.
 *
 * Utilizável aqui significa exatamente uma coisa: **tem posição**. Um posto sem
 * coordenada não pode ir para o mapa nem ter distância, e é o único campo sem o
 * qual a linha não significa nada. Todo o resto pode faltar, e falta como
 * `null` — nunca como texto inventado.
 */
function toFuelStation(feature: GeoapifyFeature): FuelStation | null {
  const properties = feature.properties
  if (typeof properties !== 'object' || properties === null) return null

  // GeoJSON é `[longitude, latitude]`. `properties.lat`/`lon` são o mesmo ponto
  // repetido pelo provedor, e servem de rede quando a geometria vem estranha.
  const coordinates = feature.geometry?.coordinates
  const fromGeometry = Array.isArray(coordinates)
    ? {
        longitude: asNumber(coordinates[0]),
        latitude: asNumber(coordinates[1]),
      }
    : { longitude: null, latitude: null }

  const longitude = fromGeometry.longitude ?? asNumber(properties.lon)
  const latitude = fromGeometry.latitude ?? asNumber(properties.lat)
  if (longitude === null || latitude === null) return null
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null

  const raw = rawTags(properties)
  const brand = firstString(properties, raw, ['brand', 'operator'])

  return {
    // `place_id` é o identificador do provedor. Sem ele, a coordenada serve de
    // chave: dois postos não ocupam o mesmo ponto.
    id: asString(properties.place_id) ?? `${longitude},${latitude}`,
    /*
     * Nome, bandeira, ou a afirmação de que não há nome.
     *
     * "Posto sem nome" não é dado inventado — é o contrário: diz na cara que o
     * OpenStreetMap não tem o nome deste posto. Herdar `address_line1` no lugar
     * faria uma rua virar o nome do estabelecimento, e aí sim seria invenção.
     */
    name: asString(properties.name) ?? brand ?? 'Posto sem nome',
    latitude,
    longitude,
    address:
      asString(properties.address_line2) ?? asString(properties.formatted),
    city: asString(properties.city),
    state: asString(properties.state),
    postcode: asString(properties.postcode),
    // Só existe quando a consulta usa `bias=proximity`, e ela usa.
    distanceMeters: asNumber(properties.distance),
    brand,
    openingHours: firstString(properties, raw, ['opening_hours']),
    categories: asStringArray(properties.categories),
  }
}

/**
 * O cliente da Places API da Geoapify.
 *
 * A chave entra por parâmetro, e não é lida aqui de `process.env`: é o que
 * mantém este arquivo testável sem ambiente e o que deixa **um** lugar
 * (`index.ts`) decidindo se a integração existe.
 */
export function createGeoapifyFuelStationClient(
  apiKey: string,
): FuelStationClient {
  return {
    async search(query) {
      const url = new URL(ENDPOINT)
      url.searchParams.set('categories', FUEL_CATEGORY)
      /*
       * `filter` e `bias` juntos, e cada um faz uma coisa.
       *
       * `circle` RECORTA: nenhum posto de fora do raio entra. `proximity`
       * ORDENA por distância a partir do mesmo ponto — e é ele que faz o
       * provedor devolver o campo `distance`, que sem isso não vem. Só o
       * recorte devolveria vinte postos em ordem arbitrária dentro de 20 km, o
       * que é a pergunta errada: quem para no acostamento quer o mais perto.
       *
       * Os dois recebem `longitude,latitude` — a ordem inversa da nossa.
       */
      url.searchParams.set(
        'filter',
        `circle:${query.center.longitude},${query.center.latitude},${query.radiusM}`,
      )
      url.searchParams.set(
        'bias',
        `proximity:${query.center.longitude},${query.center.latitude}`,
      )
      url.searchParams.set('limit', String(query.limit))
      url.searchParams.set('lang', 'pt')
      url.searchParams.set('apiKey', apiKey)

      let response: Response
      try {
        response = await fetch(url, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
          next: { revalidate: REVALIDATE_SECONDS },
        })
      } catch (error) {
        // `AbortSignal.timeout` rejeita com `TimeoutError`; rede fora rejeita
        // com `TypeError`. Separar os dois é o que permite dizer "demorou" em
        // vez de "sem conexão" para quem está num sinal ruim de serra.
        const name = (error as { name?: unknown } | null)?.name
        return {
          ok: false,
          failure: name === 'TimeoutError' ? 'tempo-esgotado' : 'rede',
        }
      }

      if (!response.ok) {
        if (UNAUTHORIZED.includes(response.status)) {
          return { ok: false, failure: 'chave-recusada' }
        }
        if (response.status === TOO_MANY_REQUESTS) {
          return { ok: false, failure: 'cota' }
        }
        return { ok: false, failure: 'indisponivel' }
      }

      let body: unknown
      try {
        body = await response.json()
      } catch {
        return { ok: false, failure: 'indisponivel' }
      }

      const features = (body as { features?: unknown } | null)?.features
      if (!Array.isArray(features)) {
        return { ok: false, failure: 'indisponivel' }
      }

      const stations: FuelStation[] = []
      for (const feature of features) {
        // Uma feature quebrada não derruba as outras dezenove: o posto que não
        // dá para desenhar simplesmente não entra na lista.
        const station = toFuelStation(feature as GeoapifyFeature)
        if (station) stations.push(station)
      }

      // Lista vazia é uma resposta legítima, e não uma falha: existe estrada em
      // Santa Catarina sem posto nenhum em 20 km, e dizer isso é a resposta.
      return { ok: true, stations }
    },
  }
}

/** Exportada para teste: é aqui que mora todo o risco de formato do provedor. */
export const __test__ = { toFuelStation }
