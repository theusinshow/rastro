import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import type { FuelSearchOutcome, FuelStation } from '@/domain/fuel-stations'

const search = vi.fn<() => Promise<FuelSearchOutcome>>()
const getFuelStationClient = vi.fn<
  () => { search: typeof search } | null
>(() => ({ search }))

vi.mock('@/lib/fuel-stations', () => ({
  getFuelStationClient: () => getFuelStationClient(),
}))

const { GET } = await import('./route')

function posto(overrides: Partial<FuelStation> = {}): FuelStation {
  return {
    id: 'a',
    name: 'Posto',
    latitude: -27.6,
    longitude: -48.6,
    address: null,
    city: null,
    state: null,
    postcode: null,
    distanceMeters: null,
    brand: null,
    openingHours: null,
    categories: [],
    ...overrides,
  }
}

function chamar(query: string) {
  return GET(new NextRequest(`http://localhost:3000/api/fuel-stations${query}`))
}

const VALIDA = '?lat=-27.645&lon=-48.669'

beforeEach(() => {
  search.mockReset()
  getFuelStationClient.mockReset()
  getFuelStationClient.mockReturnValue({ search })
  // O diagnóstico é deliberado e vai para o log do servidor. Aqui ele só
  // poluiria a saída dos testes.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GET /api/fuel-stations', () => {
  it('devolve os postos ordenados do mais perto para o mais longe', async () => {
    search.mockResolvedValue({
      ok: true,
      stations: [
        posto({ id: 'longe', distanceMeters: 9000 }),
        posto({ id: 'perto', distanceMeters: 800 }),
      ],
    })

    const response = await chamar(VALIDA)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.stations.map((s: FuelStation) => s.id)).toEqual([
      'perto',
      'longe',
    ])
  })

  it('a atribuição viaja junto do dado, e não só na tela', async () => {
    // A ODbL exige o crédito ao OpenStreetMap e o plano gratuito da Geoapify
    // exige o dela. Quem consumir este endpoint recebe a obrigação junto.
    search.mockResolvedValue({ ok: true, stations: [] })

    const body = await (await chamar(VALIDA)).json()

    expect(body.attribution.data).toBe('© OpenStreetMap contributors')
    expect(body.attribution.dataUrl).toBe(
      'https://www.openstreetmap.org/copyright',
    )
    expect(body.attribution.provider).toBe('Geoapify')
  })

  it('nenhuma resposta carrega a chave da API', async () => {
    search.mockResolvedValue({ ok: true, stations: [posto()] })

    const texto = await (await chamar(VALIDA)).text()

    expect(texto).not.toContain('apiKey')
    expect(texto.toLowerCase()).not.toContain('geoapify.com/v2')
  })

  it('lista vazia é 200, e não erro', async () => {
    search.mockResolvedValue({ ok: true, stations: [] })

    const response = await chamar(VALIDA)

    expect(response.status).toBe(200)
    expect((await response.json()).stations).toEqual([])
  })

  it('repassa raio e limite validados ao provedor', async () => {
    search.mockResolvedValue({ ok: true, stations: [] })

    await chamar(`${VALIDA}&radius=5000&limit=7`)

    expect(search).toHaveBeenCalledWith({
      center: { latitude: -27.645, longitude: -48.669 },
      radiusM: 5000,
      limit: 7,
    })
  })

  it('recusa coordenada ausente, inválida ou fora do globo com 400', async () => {
    search.mockResolvedValue({ ok: true, stations: [] })

    for (const query of ['', '?lat=-27.6', '?lat=abc&lon=-48.6', '?lat=91&lon=0']) {
      const response = await chamar(query)

      expect(response.status).toBe(400)
      expect((await response.json()).error.code).toBe('parametro')
    }
    // Nem chegou a gastar crédito.
    expect(search).not.toHaveBeenCalled()
  })

  it('recusa raio e limite fora da faixa com 400', async () => {
    search.mockResolvedValue({ ok: true, stations: [] })

    expect((await chamar(`${VALIDA}&radius=900`)).status).toBe(400)
    expect((await chamar(`${VALIDA}&radius=90000`)).status).toBe(400)
    expect((await chamar(`${VALIDA}&limit=0`)).status).toBe(400)
    expect((await chamar(`${VALIDA}&limit=500`)).status).toBe(400)
    expect(search).not.toHaveBeenCalled()
  })

  it('parâmetro inválido não é retentável: não adianta apertar de novo', async () => {
    const body = await (await chamar('?lat=91&lon=0')).json()

    expect(body.error.retryable).toBe(false)
  })

  it('sem chave configurada devolve 503 e diz que não está configurado', async () => {
    getFuelStationClient.mockReturnValue(null)

    const response = await chamar(VALIDA)
    const body = await response.json()

    expect(response.status).toBe(503)
    expect(body.error.code).toBe('sem-chave')
    expect(body.error.retryable).toBe(false)
    expect(body.error.message).toContain('não está configurada')
  })

  it('cada falha do provedor vira o código HTTP correspondente', async () => {
    // Nenhuma delas é 500: nada aqui é defeito do Rastro, e um 500 faria a
    // observabilidade tratar cota estourada como bug.
    const esperado = {
      'tempo-esgotado': 504,
      cota: 503,
      'chave-recusada': 502,
      rede: 502,
      indisponivel: 502,
    } as const

    for (const [failure, status] of Object.entries(esperado)) {
      search.mockResolvedValue({
        ok: false,
        failure: failure as keyof typeof esperado,
      })

      const response = await chamar(VALIDA)

      expect(response.status).toBe(status)
      expect((await response.json()).error.code).toBe(failure)
    }
  })

  it('falha de rede e timeout são retentáveis', async () => {
    for (const failure of ['tempo-esgotado', 'rede', 'cota'] as const) {
      search.mockResolvedValue({ ok: false, failure })

      expect((await (await chamar(VALIDA)).json()).error.retryable).toBe(true)
    }
  })

  it('a resposta de sucesso não é cacheada por CDN, porque a rota exige sessão', async () => {
    search.mockResolvedValue({ ok: true, stations: [] })

    const response = await chamar(VALIDA)

    expect(response.headers.get('Cache-Control')).toContain('private')
  })
})
