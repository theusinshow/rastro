import { describe, expect, it } from 'vitest'
import {
  FUEL_LIMIT_DEFAULT,
  FUEL_LIMIT_MAX,
  FUEL_RADIUS_DEFAULT_M,
  FUEL_RADIUS_MAX_M,
  FUEL_RADIUS_MIN_M,
  describeOpeningHours,
  formatMeters,
  fuelCacheKey,
  mergeAnchor,
  movedEnoughToSearchAgain,
  parseFuelQuery,
  sortByDistance,
  type FuelAnchor,
  type FuelStation,
} from './fuel-stations'

function posto(overrides: Partial<FuelStation> = {}): FuelStation {
  return {
    id: 'x',
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

describe('parseFuelQuery', () => {
  it('aceita a consulta mínima e aplica os padrões', () => {
    const resultado = parseFuelQuery({ lat: '-27.645', lon: '-48.669' })

    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.query.center).toEqual({
      latitude: -27.645,
      longitude: -48.669,
    })
    expect(resultado.query.radiusM).toBe(FUEL_RADIUS_DEFAULT_M)
    expect(resultado.query.limit).toBe(FUEL_LIMIT_DEFAULT)
  })

  it('aceita raio e limite dentro da faixa', () => {
    const resultado = parseFuelQuery({
      lat: '-27.6',
      lon: '-48.6',
      radius: '5000',
      limit: '7',
    })

    expect(resultado.ok).toBe(true)
    if (!resultado.ok) return
    expect(resultado.query.radiusM).toBe(5000)
    expect(resultado.query.limit).toBe(7)
  })

  it('recusa coordenada ausente, vazia ou que não é número', () => {
    expect(parseFuelQuery({}).ok).toBe(false)
    expect(parseFuelQuery({ lat: '-27.6' }).ok).toBe(false)
    expect(parseFuelQuery({ lat: '', lon: '' }).ok).toBe(false)
    expect(parseFuelQuery({ lat: 'abc', lon: '-48.6' }).ok).toBe(false)
    // `Number(' ')` é zero: sem o corte no vazio, isto viraria a ilha de Null.
    expect(parseFuelQuery({ lat: ' ', lon: ' ' }).ok).toBe(false)
    expect(parseFuelQuery({ lat: 'Infinity', lon: '-48.6' }).ok).toBe(false)
  })

  it('recusa coordenada fora do globo', () => {
    expect(parseFuelQuery({ lat: '91', lon: '0' })).toEqual({
      ok: false,
      problem: 'coordenada',
    })
    expect(parseFuelQuery({ lat: '0', lon: '181' })).toEqual({
      ok: false,
      problem: 'coordenada',
    })
  })

  it('recusa raio fora da faixa em vez de grampeá-lo em silêncio', () => {
    // Grampear devolveria uma resposta que não é a pedida, e quem chamou não
    // teria como saber que o raio mudou.
    expect(
      parseFuelQuery({
        lat: '-27.6',
        lon: '-48.6',
        radius: String(FUEL_RADIUS_MIN_M - 1),
      }),
    ).toEqual({ ok: false, problem: 'raio' })

    expect(
      parseFuelQuery({
        lat: '-27.6',
        lon: '-48.6',
        radius: String(FUEL_RADIUS_MAX_M + 1),
      }),
    ).toEqual({ ok: false, problem: 'raio' })

    expect(
      parseFuelQuery({ lat: '-27.6', lon: '-48.6', radius: '-5000' }),
    ).toEqual({ ok: false, problem: 'raio' })
  })

  it('aceita exatamente as bordas do raio', () => {
    for (const radius of [FUEL_RADIUS_MIN_M, FUEL_RADIUS_MAX_M]) {
      const resultado = parseFuelQuery({
        lat: '-27.6',
        lon: '-48.6',
        radius: String(radius),
      })
      expect(resultado.ok).toBe(true)
    }
  })

  it('recusa limite fora da faixa', () => {
    expect(parseFuelQuery({ lat: '-27.6', lon: '-48.6', limit: '0' })).toEqual({
      ok: false,
      problem: 'limite',
    })
    expect(
      parseFuelQuery({
        lat: '-27.6',
        lon: '-48.6',
        limit: String(FUEL_LIMIT_MAX + 1),
      }),
    ).toEqual({ ok: false, problem: 'limite' })
  })

  it('parâmetro ausente cai no padrão; parâmetro errado é recusa', () => {
    // Não pedir não é pedir errado.
    expect(parseFuelQuery({ lat: '0', lon: '0', radius: null }).ok).toBe(true)
    expect(parseFuelQuery({ lat: '0', lon: '0', radius: '10' }).ok).toBe(false)
  })
})

describe('sortByDistance', () => {
  it('ordena do mais perto para o mais longe', () => {
    const ordenado = sortByDistance([
      posto({ id: 'c', distanceMeters: 9000 }),
      posto({ id: 'a', distanceMeters: 500 }),
      posto({ id: 'b', distanceMeters: 3200 }),
    ])

    expect(ordenado.map((p) => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('quem não tem distância vai para o fim, nunca para o começo', () => {
    // Sem distância não há como afirmar que está perto.
    const ordenado = sortByDistance([
      posto({ id: 'sem-distancia', distanceMeters: null }),
      posto({ id: 'perto', distanceMeters: 3000 }),
    ])

    expect(ordenado.map((p) => p.id)).toEqual(['perto', 'sem-distancia'])
  })

  it('não altera a lista recebida', () => {
    const original = [
      posto({ id: 'b', distanceMeters: 2000 }),
      posto({ id: 'a', distanceMeters: 1000 }),
    ]
    sortByDistance(original)

    expect(original.map((p) => p.id)).toEqual(['b', 'a'])
  })
})

describe('fuelCacheKey', () => {
  const base = {
    center: { latitude: -27.6451, longitude: -48.6692 },
    radiusM: 20000,
    limit: 20,
  }

  it('dois pontos a poucos metros compartilham a mesma chave', () => {
    // Mover o mapa dois quarteirões não pode custar uma consulta nova: o
    // conjunto de postos num raio de 20 km é rigorosamente o mesmo.
    expect(fuelCacheKey(base)).toBe(
      fuelCacheKey({
        ...base,
        center: { latitude: -27.64511, longitude: -48.66919 },
      }),
    )
  })

  it('raio e limite diferentes são consultas diferentes', () => {
    expect(fuelCacheKey({ ...base, radiusM: 5000 })).not.toBe(
      fuelCacheKey(base),
    )
    expect(fuelCacheKey({ ...base, limit: 5 })).not.toBe(fuelCacheKey(base))
  })

  it('pontos de bairros diferentes não compartilham chave', () => {
    expect(
      fuelCacheKey({ ...base, center: { latitude: -27.7, longitude: -48.6 } }),
    ).not.toBe(fuelCacheKey(base))
  })
})

describe('movedEnoughToSearchAgain', () => {
  const ponto = { latitude: -27.6, longitude: -48.6 }

  it('não pede busca nova quando o mapa mal se moveu', () => {
    expect(
      movedEnoughToSearchAgain(
        ponto,
        { latitude: -27.605, longitude: -48.6 },
        20_000,
      ),
    ).toBe(false)
  })

  it('pede busca nova quando o mapa saiu da área consultada', () => {
    // ~11 km ao sul, contra um quinto de 20 km = 4 km de limiar.
    expect(
      movedEnoughToSearchAgain(
        ponto,
        { latitude: -27.7, longitude: -48.6 },
        20_000,
      ),
    ).toBe(true)
  })

  it('o limiar acompanha o raio: o mesmo passo decide diferente', () => {
    const passo = { latitude: -27.615, longitude: -48.6 } // ~1,7 km

    expect(movedEnoughToSearchAgain(ponto, passo, 20_000)).toBe(false)
    expect(movedEnoughToSearchAgain(ponto, passo, 1_000)).toBe(true)
  })
})

describe('mergeAnchor', () => {
  const lugar: FuelAnchor = {
    kind: 'lugar',
    label: 'Serra do Corvo Branco',
    coordinates: { latitude: -28.1, longitude: -49.5 },
  }
  const mapa: FuelAnchor = {
    kind: 'mapa',
    label: 'centro do mapa',
    coordinates: { latitude: -27.8, longitude: -49.3 },
  }

  it('mantém na lista o ponto de referência que saiu das opções', () => {
    // Ligar postos com um lugar selecionado fecha o painel do lugar — e o
    // lugar sai das opções enquanto a busca dele ainda está na tela.
    expect(mergeAnchor([mapa], lugar)).toEqual([lugar, mapa])
  })

  it('não duplica quando o tipo já está na lista', () => {
    expect(mergeAnchor([lugar, mapa], lugar)).toEqual([lugar, mapa])
  })

  it('sem ponto de referência, devolve as opções como estão', () => {
    expect(mergeAnchor([mapa], null)).toEqual([mapa])
  })

  it('não altera a lista recebida', () => {
    const opcoes = [mapa]
    mergeAnchor(opcoes, lugar)

    expect(opcoes).toEqual([mapa])
  })
})

describe('describeOpeningHours', () => {
  it('traduz o único caso que muda a decisão às três da manhã', () => {
    expect(describeOpeningHours('24/7')).toBe('24 horas')
  })

  it('todo o resto sai como o OpenStreetMap escreveu', () => {
    // Interpretar a gramática de horários do OSM daria um formatador cheio de
    // casos, e cada caso mal traduzido seria um horário que ninguém verificou.
    expect(describeOpeningHours('Mo-Su 06:00-22:00')).toBe('Mo-Su 06:00-22:00')
    expect(describeOpeningHours('Mo-Fr 07:00-19:00; Sa 08:00-12:00')).toBe(
      'Mo-Fr 07:00-19:00; Sa 08:00-12:00',
    )
  })

  it('sem horário mapeado, não inventa horário', () => {
    expect(describeOpeningHours(null)).toBeNull()
    expect(describeOpeningHours('   ')).toBeNull()
  })
})

describe('formatMeters', () => {
  it('abaixo de 1 km arredonda para dezenas de metro', () => {
    expect(formatMeters(683)).toBe('680 m')
    expect(formatMeters(12)).toBe('10 m')
  })

  it('acima de 1 km vira quilômetro com vírgula decimal', () => {
    expect(formatMeters(2232)).toBe('2,2 km')
    expect(formatMeters(19_400)).toBe('19,4 km')
  })
})
