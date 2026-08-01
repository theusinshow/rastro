import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FuelQuery } from '@/domain/fuel-stations'
import { __resetFuelCache, searchFuelStations } from './browser'

const CONSULTA: FuelQuery = {
  center: { latitude: -27.645, longitude: -48.669 },
  radiusM: 20_000,
  limit: 20,
}

const POSTO = {
  id: 'a',
  name: 'Posto Serra',
  latitude: -27.6,
  longitude: -48.6,
  address: null,
  city: null,
  state: null,
  postcode: null,
  distanceMeters: 1200,
  brand: null,
  openingHours: null,
  categories: [],
}

function respostaOk(stations: unknown[] = [POSTO]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ stations, attribution: {} }),
  } as unknown as Response
}

function respostaErro(status: number, code: string) {
  return {
    ok: false,
    status,
    json: async () => ({ error: { code, message: 'x', retryable: true } }),
  } as unknown as Response
}

/** Espera as microtarefas pendentes sem depender de temporizador real. */
function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(() => {
  __resetFuelCache()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('searchFuelStations', () => {
  it('monta a consulta para o endpoint interno, e não para o provedor', async () => {
    const espia = vi.fn<(url: string | URL) => Promise<Response>>(async () =>
      respostaOk(),
    )
    vi.stubGlobal('fetch', espia)

    await searchFuelStations(CONSULTA)

    const url = new URL(String(espia.mock.calls[0]?.[0]))
    expect(url.pathname).toBe('/api/fuel-stations')
    expect(url.searchParams.get('lat')).toBe('-27.645')
    expect(url.searchParams.get('lon')).toBe('-48.669')
    expect(url.searchParams.get('radius')).toBe('20000')
    expect(url.searchParams.get('limit')).toBe('20')
    // A chave da Geoapify não existe deste lado, e nada aqui pode sugerir que
    // exista.
    expect(url.searchParams.get('apiKey')).toBeNull()
  })

  it('devolve os postos da resposta', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaOk()))

    const resultado = await searchFuelStations(CONSULTA)

    expect(resultado).toEqual({ ok: true, stations: [POSTO] })
  })

  it('descarta item da lista que não tem posição', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => respostaOk([POSTO, { id: 'b' }, null])),
    )

    const resultado = await searchFuelStations(CONSULTA)

    expect(resultado?.ok).toBe(true)
    if (!resultado?.ok) return
    expect(resultado.stations).toHaveLength(1)
  })

  it('a segunda busca igual sai do cache, sem tocar na rede', async () => {
    const espia = vi.fn(async () => respostaOk())
    vi.stubGlobal('fetch', espia)

    await searchFuelStations(CONSULTA)
    await searchFuelStations(CONSULTA)

    expect(espia).toHaveBeenCalledTimes(1)
  })

  it('mover o mapa poucos metros continua acertando o cache', async () => {
    const espia = vi.fn(async () => respostaOk())
    vi.stubGlobal('fetch', espia)

    await searchFuelStations(CONSULTA)
    await searchFuelStations({
      ...CONSULTA,
      center: { latitude: -27.64502, longitude: -48.66903 },
    })

    expect(espia).toHaveBeenCalledTimes(1)
  })

  it('raio diferente é consulta diferente', async () => {
    const espia = vi.fn(async () => respostaOk())
    vi.stubGlobal('fetch', espia)

    await searchFuelStations(CONSULTA)
    await searchFuelStations({ ...CONSULTA, radiusM: 5000 })

    expect(espia).toHaveBeenCalledTimes(2)
  })

  it('duas buscas simultâneas iguais viram uma requisição só', async () => {
    let libera: (value: Response) => void = () => {}
    const espia = vi.fn(
      () => new Promise<Response>((resolve) => (libera = resolve)),
    )
    vi.stubGlobal('fetch', espia)

    const a = searchFuelStations(CONSULTA)
    const b = searchFuelStations(CONSULTA)
    libera(respostaOk())

    expect(await a).toEqual(await b)
    expect(espia).toHaveBeenCalledTimes(1)
  })

  it('erro do endpoint chega com o código nomeado', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaErro(503, 'cota')))
    expect(await searchFuelStations(CONSULTA)).toEqual({
      ok: false,
      failure: 'cota',
    })

    vi.stubGlobal('fetch', vi.fn(async () => respostaErro(503, 'sem-chave')))
    expect(await searchFuelStations({ ...CONSULTA, limit: 19 })).toEqual({
      ok: false,
      failure: 'sem-chave',
    })
  })

  it('código desconhecido do endpoint vira indisponivel', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respostaErro(500, 'coisa-nova')))

    expect(await searchFuelStations(CONSULTA)).toEqual({
      ok: false,
      failure: 'indisponivel',
    })
  })

  it('rede fora vira falha de rede', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed')
      }),
    )

    expect(await searchFuelStations(CONSULTA)).toEqual({
      ok: false,
      failure: 'rede',
    })
  })

  it('resposta que não é JSON — sessão expirada — vira indisponivel', async () => {
    // O proxy redireciona requisição sem sessão para `/entrar`, e o `fetch`
    // segue: chega HTML com status 200.
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => {
              throw new SyntaxError('Unexpected token <')
            },
          }) as unknown as Response,
      ),
    )

    expect(await searchFuelStations(CONSULTA)).toEqual({
      ok: false,
      failure: 'indisponivel',
    })
  })

  it('cancelar não é erro: devolve null e não escreve nada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: unknown, init: { signal?: AbortSignal } = {}) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener('abort', () =>
              reject(
                Object.assign(new Error('aborted'), { name: 'AbortError' }),
              ),
            )
          }),
      ),
    )

    const controller = new AbortController()
    const pendente = searchFuelStations(CONSULTA, controller.signal)
    await flush()
    controller.abort()

    expect(await pendente).toBeNull()
  })

  it('um chamador desistir não cancela a busca do outro', async () => {
    // Sem a contagem de interessados, a primeira desistência abortaria a
    // resposta da segunda tela — que ficaria carregando para sempre.
    let libera: (value: Response) => void = () => {}
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: unknown, init: { signal?: AbortSignal } = {}) =>
          new Promise<Response>((resolve, reject) => {
            libera = resolve
            init.signal?.addEventListener('abort', () =>
              reject(
                Object.assign(new Error('aborted'), { name: 'AbortError' }),
              ),
            )
          }),
      ),
    )

    const desistente = new AbortController()
    const persistente = new AbortController()
    const a = searchFuelStations(CONSULTA, desistente.signal)
    const b = searchFuelStations(CONSULTA, persistente.signal)

    await flush()
    desistente.abort()
    await flush()
    libera(respostaOk())

    expect(await a).toBeNull()
    expect(await b).toEqual({ ok: true, stations: [POSTO] })
  })

  it('a falha não é cacheada: tentar de novo tenta de novo', async () => {
    const espia = vi
      .fn<() => Promise<Response>>()
      .mockResolvedValueOnce(respostaErro(502, 'indisponivel'))
      .mockResolvedValueOnce(respostaOk())
    vi.stubGlobal('fetch', espia)

    expect(await searchFuelStations(CONSULTA)).toEqual({
      ok: false,
      failure: 'indisponivel',
    })
    expect(await searchFuelStations(CONSULTA)).toEqual({
      ok: true,
      stations: [POSTO],
    })
    expect(espia).toHaveBeenCalledTimes(2)
  })
})
