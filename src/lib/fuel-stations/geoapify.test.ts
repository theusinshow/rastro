import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FuelQuery } from '@/domain/fuel-stations'
import { __test__, createGeoapifyFuelStationClient } from './geoapify'

const { toFuelStation } = __test__

const CONSULTA: FuelQuery = {
  center: { latitude: -27.645, longitude: -48.669 },
  radiusM: 20_000,
  limit: 20,
}

/** Uma feature como a Places API a devolve, com o mínimo documentado. */
function feature(properties: Record<string, unknown> = {}) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [-48.66, -27.64] },
    properties: {
      place_id: 'abc123',
      name: 'Posto Serra Alta',
      categories: ['service', 'service.vehicle', 'service.vehicle.fuel'],
      ...properties,
    },
  }
}

function respostaOk(features: unknown[]) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ type: 'FeatureCollection', features }),
  } as unknown as Response
}

function respostaStatus(status: number) {
  return {
    ok: false,
    status,
    json: async () => ({}),
  } as unknown as Response
}

function stubFetch(implementation: () => Promise<Response>) {
  vi.stubGlobal('fetch', vi.fn(implementation))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('toFuelStation', () => {
  it('traduz uma feature completa', () => {
    const posto = toFuelStation(
      feature({
        address_line2: 'Rodovia BR-282, Bom Retiro, Santa Catarina',
        city: 'Bom Retiro',
        state: 'Santa Catarina',
        postcode: '88680-000',
        distance: 4312,
        brand: 'Ipiranga',
        opening_hours: 'Mo-Su 06:00-22:00',
      }),
    )

    expect(posto).toEqual({
      id: 'abc123',
      name: 'Posto Serra Alta',
      latitude: -27.64,
      longitude: -48.66,
      address: 'Rodovia BR-282, Bom Retiro, Santa Catarina',
      city: 'Bom Retiro',
      state: 'Santa Catarina',
      postcode: '88680-000',
      distanceMeters: 4312,
      brand: 'Ipiranga',
      openingHours: 'Mo-Su 06:00-22:00',
      categories: ['service', 'service.vehicle', 'service.vehicle.fuel'],
    })
  })

  it('campo ausente vira null, e nunca texto inventado', () => {
    const posto = toFuelStation(feature())

    expect(posto?.address).toBeNull()
    expect(posto?.city).toBeNull()
    expect(posto?.state).toBeNull()
    expect(posto?.postcode).toBeNull()
    expect(posto?.brand).toBeNull()
    expect(posto?.openingHours).toBeNull()
    expect(posto?.distanceMeters).toBeNull()
  })

  it('lê bandeira e horário das tags cruas do OpenStreetMap', () => {
    // O provedor às vezes promove estas tags ao topo e às vezes as deixa só em
    // `datasource.raw`. Ler os dois lugares é o que impede o horário de sumir
    // por uma decisão de formato que não é nossa.
    const posto = toFuelStation(
      feature({
        datasource: {
          sourcename: 'openstreetmap',
          raw: { brand: 'Shell', opening_hours: '24/7' },
        },
      }),
    )

    expect(posto?.brand).toBe('Shell')
    expect(posto?.openingHours).toBe('24/7')
  })

  it('usa `operator` quando não há `brand`', () => {
    const posto = toFuelStation(
      feature({ datasource: { raw: { operator: 'Cooperativa Sul' } } }),
    )

    expect(posto?.brand).toBe('Cooperativa Sul')
  })

  it('sem nome, usa a bandeira; sem as duas, diz que não há nome', () => {
    // "Posto sem nome" não é invenção — é a afirmação de que o OpenStreetMap
    // não tem o nome deste posto. Herdar o endereço faria a rua virar nome.
    expect(
      toFuelStation(feature({ name: undefined, brand: 'Petrobras' }))?.name,
    ).toBe('Petrobras')

    expect(toFuelStation(feature({ name: undefined }))?.name).toBe(
      'Posto sem nome',
    )
    expect(toFuelStation(feature({ name: '   ' }))?.name).toBe('Posto sem nome')
  })

  it('sem coordenada não há posto: é o único campo indispensável', () => {
    expect(
      toFuelStation({ geometry: {}, properties: { place_id: 'x' } }),
    ).toBeNull()
    expect(toFuelStation({ properties: undefined })).toBeNull()
    expect(
      toFuelStation({
        geometry: { coordinates: ['-48.6', '-27.6'] },
        properties: {},
      }),
    ).toBeNull()
  })

  it('cai em properties.lat/lon quando a geometria não serve', () => {
    const posto = toFuelStation({
      geometry: { coordinates: null },
      properties: { lat: -27.5, lon: -48.5 },
    })

    expect(posto?.latitude).toBe(-27.5)
    expect(posto?.longitude).toBe(-48.5)
  })

  it('recusa coordenada fora do globo', () => {
    expect(
      toFuelStation({
        geometry: { coordinates: [-48.6, 120] },
        properties: {},
      }),
    ).toBeNull()
  })

  it('sem place_id, a coordenada serve de chave', () => {
    const posto = toFuelStation(feature({ place_id: undefined }))

    expect(posto?.id).toBe('-48.66,-27.64')
  })

  it('categorias que não são texto são descartadas', () => {
    expect(toFuelStation(feature({ categories: 'fuel' }))?.categories).toEqual(
      [],
    )
    expect(
      toFuelStation(feature({ categories: ['fuel', 7, null] }))?.categories,
    ).toEqual(['fuel'])
  })
})

describe('createGeoapifyFuelStationClient', () => {
  it('monta a consulta com recorte, viés, categoria e chave', async () => {
    const espia = vi.fn<(url: string | URL) => Promise<Response>>(async () =>
      respostaOk([]),
    )
    vi.stubGlobal('fetch', espia)

    await createGeoapifyFuelStationClient('CHAVE').search(CONSULTA)

    const url = new URL(String(espia.mock.calls[0]?.[0]))
    expect(url.origin + url.pathname).toBe('https://api.geoapify.com/v2/places')
    expect(url.searchParams.get('categories')).toBe('service.vehicle.fuel')
    // `longitude,latitude` — a ordem inversa da nossa. Trocar não dá erro:
    // devolve postos do meio do oceano, calado.
    expect(url.searchParams.get('filter')).toBe(
      'circle:-48.669,-27.645,20000',
    )
    expect(url.searchParams.get('bias')).toBe('proximity:-48.669,-27.645')
    expect(url.searchParams.get('limit')).toBe('20')
    expect(url.searchParams.get('apiKey')).toBe('CHAVE')
  })

  it('devolve os postos traduzidos', async () => {
    stubFetch(async () => respostaOk([feature(), feature({ place_id: 'b' })]))

    const resultado = await createGeoapifyFuelStationClient('K').search(CONSULTA)

    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.stations).toHaveLength(2)
    expect(resultado.stations[0]?.id).toBe('abc123')
  })

  it('uma feature quebrada não derruba as outras', async () => {
    stubFetch(async () => respostaOk([{ properties: {} }, feature()]))

    const resultado = await createGeoapifyFuelStationClient('K').search(CONSULTA)

    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.stations).toHaveLength(1)
  })

  it('lista vazia é resposta legítima, não falha', async () => {
    // Existe estrada em Santa Catarina sem posto nenhum em 20 km, e dizer isso
    // é a resposta.
    stubFetch(async () => respostaOk([]))

    expect(await createGeoapifyFuelStationClient('K').search(CONSULTA)).toEqual({
      ok: true,
      stations: [],
    })
  })

  it('separa timeout de queda de rede', async () => {
    stubFetch(async () => {
      throw Object.assign(new Error('timed out'), { name: 'TimeoutError' })
    })
    expect(await createGeoapifyFuelStationClient('K').search(CONSULTA)).toEqual({
      ok: false,
      failure: 'tempo-esgotado',
    })

    stubFetch(async () => {
      throw new TypeError('fetch failed')
    })
    expect(await createGeoapifyFuelStationClient('K').search(CONSULTA)).toEqual({
      ok: false,
      failure: 'rede',
    })
  })

  it('nomeia credencial recusada e cota estourada', async () => {
    for (const status of [401, 403]) {
      stubFetch(async () => respostaStatus(status))
      expect(
        await createGeoapifyFuelStationClient('K').search(CONSULTA),
      ).toEqual({ ok: false, failure: 'chave-recusada' })
    }

    stubFetch(async () => respostaStatus(429))
    expect(await createGeoapifyFuelStationClient('K').search(CONSULTA)).toEqual({
      ok: false,
      failure: 'cota',
    })

    stubFetch(async () => respostaStatus(500))
    expect(await createGeoapifyFuelStationClient('K').search(CONSULTA)).toEqual({
      ok: false,
      failure: 'indisponivel',
    })
  })

  it('corpo inesperado não vira lista vazia disfarçada', async () => {
    // Devolver `[]` aqui diria "não há postos" quando o que houve foi o
    // provedor mudar de formato. São coisas diferentes na tela.
    stubFetch(
      async () =>
        ({ ok: true, status: 200, json: async () => ({ erro: 'oops' }) }) as
          unknown as Response,
    )
    expect(await createGeoapifyFuelStationClient('K').search(CONSULTA)).toEqual({
      ok: false,
      failure: 'indisponivel',
    })

    stubFetch(
      async () =>
        ({
          ok: true,
          status: 200,
          json: async () => {
            throw new SyntaxError('not json')
          },
        }) as unknown as Response,
    )
    expect(await createGeoapifyFuelStationClient('K').search(CONSULTA)).toEqual({
      ok: false,
      failure: 'indisponivel',
    })
  })

  it('nunca lança, qualquer que seja a falha', async () => {
    stubFetch(async () => {
      throw new Error('qualquer coisa')
    })

    await expect(
      createGeoapifyFuelStationClient('K').search(CONSULTA),
    ).resolves.toEqual({ ok: false, failure: 'rede' })
  })
})
