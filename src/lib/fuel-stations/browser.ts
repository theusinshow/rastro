import {
  fuelCacheKey,
  type FuelQuery,
  type FuelSearchFailure,
  type FuelSearchOutcome,
  type FuelStation,
} from '@/domain/fuel-stations'

/**
 * A metade de NAVEGADOR da busca de postos.
 *
 * Fala com `/api/fuel-stations`, nunca com a Geoapify — este arquivo é
 * empacotado e entregue ao navegador, e é justamente por isso que ele não
 * importa `./index`, que lê `process.env.GEOAPIFY_API_KEY`. Mesma separação de
 * `src/lib/supabase/browser.ts` e `server.ts`, e pela mesma razão.
 *
 * Três responsabilidades, e nenhuma delas é React:
 *
 * 1. **Cache** por coordenada aproximada, raio e limite (ver `fuelCacheKey`).
 * 2. **Deduplicação**: duas telas pedindo a mesma coisa ao mesmo tempo geram uma
 *    requisição, não duas.
 * 3. **Cancelamento**: trocar o ponto de busca aborta o que estava em curso, e a
 *    resposta velha nunca sobrescreve a lista nova.
 */

const ENDPOINT = '/api/fuel-stations'

/**
 * Base para resolver o caminho do endpoint.
 *
 * No navegador é a própria origem — a requisição nunca sai do domínio do
 * Rastro. Fora dele (o ambiente `node` do Vitest) não existe `location`, e uma
 * base sintética basta: o que se verifica em teste é a consulta montada, não o
 * host.
 */
const BASE_URL =
  typeof location === 'undefined' ? 'http://localhost' : location.origin

/**
 * Validade do cache do navegador. Dez minutos.
 *
 * Bem menor que as seis horas do cache do servidor, e de propósito: aqui o que
 * se economiza é ida à rede numa sessão, e o custo de errar é mostrar uma lista
 * de dez minutos atrás. Lá o que se economiza é crédito da chave, e o dado do
 * OpenStreetMap muda em escala de semanas.
 */
const TTL_MS = 10 * 60 * 1000

/**
 * Teto do navegador, acima do teto do servidor (8 s).
 *
 * Precisa ser maior, ou o cliente desistiria de uma resposta que ainda estava
 * vindo e a interface culparia a rede por uma lentidão do provedor.
 */
const TIMEOUT_MS = 12_000

interface CacheEntry {
  at: number
  stations: FuelStation[]
}

interface Flight {
  promise: Promise<FuelSearchOutcome>
  controller: AbortController
  /** Quantos chamadores ainda querem esta resposta. Ver `subscribe`. */
  waiting: number
  /** O aborto veio do prazo, e não da desistência de todo mundo. */
  hasTimedOut: () => boolean
}

const cache = new Map<string, CacheEntry>()
const flights = new Map<string, Flight>()

/** Códigos que o endpoint pode devolver. Qualquer outro vira `indisponivel`. */
const KNOWN_FAILURES: readonly FuelSearchFailure[] = [
  'sem-chave',
  'parametro',
  'tempo-esgotado',
  'rede',
  'cota',
  'chave-recusada',
  'indisponivel',
]

function toFailure(value: unknown): FuelSearchFailure {
  return KNOWN_FAILURES.find((known) => known === value) ?? 'indisponivel'
}

/**
 * O endpoint é nosso, mas a resposta ainda atravessa a rede.
 *
 * A checagem é rasa de propósito — o corpo já foi normalizado no servidor, e
 * repetir aqui a tradução inteira do provedor criaria duas verdades sobre o
 * mesmo formato. O que se confere é que a lista é uma lista de objetos com
 * posição, que é o mínimo para o mapa não quebrar.
 */
function isFuelStation(value: unknown): value is FuelStation {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.latitude === 'number' &&
    typeof candidate.longitude === 'number'
  )
}

async function request(
  query: FuelQuery,
  signal: AbortSignal,
): Promise<FuelSearchOutcome> {
  const url = new URL(ENDPOINT, BASE_URL)
  url.searchParams.set('lat', String(query.center.latitude))
  url.searchParams.set('lon', String(query.center.longitude))
  url.searchParams.set('radius', String(query.radiusM))
  url.searchParams.set('limit', String(query.limit))

  let response: Response
  try {
    response = await fetch(url, { signal })
  } catch (error) {
    // Aborto sobe como `AbortError` e é tratado por quem chamou, não aqui.
    if ((error as { name?: unknown } | null)?.name === 'AbortError') throw error
    return { ok: false, failure: 'rede' }
  }

  /*
   * Sessão expirada não é falha de rede.
   *
   * `src/proxy.ts` redireciona requisição sem sessão para `/entrar`, e o
   * `fetch` segue o redirecionamento: chegaria aqui um HTML com status 200, e
   * `json()` estouraria. Isto vira "não respondeu como esperado" — e o próximo
   * gesto da pessoa em qualquer outra parte do app a leva ao login de verdade.
   */
  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { ok: false, failure: 'indisponivel' }
  }

  if (!response.ok) {
    const code = (body as { error?: { code?: unknown } } | null)?.error?.code
    return { ok: false, failure: toFailure(code) }
  }

  const stations = (body as { stations?: unknown } | null)?.stations
  if (!Array.isArray(stations)) {
    return { ok: false, failure: 'indisponivel' }
  }

  return { ok: true, stations: stations.filter(isFuelStation) }
}

/**
 * Liga o sinal de UM chamador a um voo compartilhado.
 *
 * O voo só é abortado quando **todos** os interessados desistirem. Sem esta
 * contagem, duas telas pedindo a mesma busca ao mesmo tempo dariam a uma delas
 * o poder de cancelar a resposta da outra — e a segunda ficaria carregando para
 * sempre, sem erro em lugar nenhum.
 */
function subscribe(flight: Flight, signal: AbortSignal | undefined): void {
  if (!signal) return
  flight.waiting += 1

  const release = () => {
    flight.waiting -= 1
    if (flight.waiting <= 0) flight.controller.abort()
  }

  if (signal.aborted) {
    release()
    return
  }
  signal.addEventListener('abort', release, { once: true })
}

/**
 * Busca postos em volta de um ponto.
 *
 * Devolve `null` quando a busca foi **cancelada** — e cancelamento não é erro:
 * é o que acontece quando a pessoa move o ponto de busca antes de a resposta
 * anterior chegar. Quem chama simplesmente não escreve nada na tela.
 *
 * **Nunca lança.**
 */
export async function searchFuelStations(
  query: FuelQuery,
  signal?: AbortSignal,
): Promise<FuelSearchOutcome | null> {
  if (signal?.aborted) return null

  const key = fuelCacheKey(query)

  const cached = cache.get(key)
  if (cached && Date.now() - cached.at < TTL_MS) {
    return { ok: true, stations: cached.stations }
  }

  const flight = flights.get(key) ?? launch(key, query)
  subscribe(flight, signal)
  const outcome = await settle(flight)

  /*
   * O voo pode ter chegado inteiro e este chamador ter desistido no meio.
   *
   * Acontece sempre que duas telas pedem a mesma busca: o voo é compartilhado, e
   * a desistência de uma não aborta a requisição da outra — mas também não pode
   * devolver a lista a quem já saiu. Sem esta última checagem, mover o ponto de
   * busca escreveria na tela o resultado do ponto anterior.
   */
  return signal?.aborted ? null : outcome
}

/** Um voo novo: uma requisição, um prazo, um controlador. */
function launch(key: string, query: FuelQuery): Flight {
  const controller = new AbortController()
  let timedOut = false

  // Um temporizador só: ele marca a razão ANTES de abortar, para que o `catch`
  // consiga separar "o prazo estourou" de "todo mundo desistiu". Dois
  // temporizadores no mesmo prazo não têm ordem garantida entre si.
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, TIMEOUT_MS)

  const promise = (async () => {
    try {
      const outcome = await request(query, controller.signal)
      if (outcome.ok) {
        cache.set(key, { at: Date.now(), stations: outcome.stations })
      }
      return outcome
    } finally {
      clearTimeout(timer)
      flights.delete(key)
    }
  })()

  const flight: Flight = {
    promise,
    controller,
    waiting: 0,
    hasTimedOut: () => timedOut,
  }
  flights.set(key, flight)
  return flight
}

/** Traduz o fim de um voo — inclusive o aborto — para o contrato público. */
async function settle(flight: Flight): Promise<FuelSearchOutcome | null> {
  try {
    return await flight.promise
  } catch (error) {
    if ((error as { name?: unknown } | null)?.name === 'AbortError') {
      return flight.hasTimedOut() ? { ok: false, failure: 'tempo-esgotado' } : null
    }
    return { ok: false, failure: 'indisponivel' }
  }
}

/** Uso exclusivo de teste: o cache é um módulo, e módulo sobrevive entre casos. */
export function __resetFuelCache(): void {
  cache.clear()
  flights.clear()
}
