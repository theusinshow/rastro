import { describe, expect, it } from 'vitest'
import { matchesSearch, normalizeForSearch } from './filters'
import {
  DEFAULT_EXPLORE_FILTERS,
  countActiveCriteria,
  describeFilters,
  filterPlaces,
  mostRestrictiveCriterion,
} from './filters'
import { CATEGORY_LABELS, type ExplorePlace } from './place'

const ORIGIN = { latitude: -27.6455, longitude: -48.67 }

function place(overrides: Partial<ExplorePlace>): ExplorePlace {
  return {
    id: 'x',
    slug: 'x',
    name: 'X',
    description: '',
    latitude: -27.6455,
    longitude: -48.67,
    municipality: 'Palhoça',
    stateCode: 'SC',
    category: 'serra',
    tags: [],
    coverImageUrl: null,
    source: 'mock',
    visitStatus: 'nao-visitado',
    isFavorite: false,
    visits: [],
    isOwn: false,
    accessSurface: null,
    photoCount: 0,
    lastVisitedAt: null,
    ...overrides,
  }
}

describe('filterPlaces', () => {
  it('sem filtros, devolve tudo', () => {
    const places = [place({ id: 'a' }), place({ id: 'b', category: 'praia' })]
    expect(filterPlaces(places, DEFAULT_EXPLORE_FILTERS, ORIGIN)).toHaveLength(2)
  })

  it('filtra por categoria, aceitando qualquer uma das selecionadas', () => {
    const places = [
      place({ id: 'a', category: 'serra' }),
      place({ id: 'b', category: 'praia' }),
      place({ id: 'c', category: 'cafe' }),
    ]
    const result = filterPlaces(
      places,
      { ...DEFAULT_EXPLORE_FILTERS, categories: ['serra', 'praia'] },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('filtra por raio em linha reta a partir da origem', () => {
    const perto = place({ id: 'perto' })
    const longe = place({ id: 'longe', latitude: -28.39, longitude: -49.54 })
    const result = filterPlaces(
      [perto, longe],
      { ...DEFAULT_EXPLORE_FILTERS, radiusKm: 50 },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['perto'])
  })

  it('filtra por status de visita', () => {
    const places = [
      place({ id: 'a', visitStatus: 'visitado' }),
      place({ id: 'b', visitStatus: 'nao-visitado' }),
    ]
    const result = filterPlaces(
      places,
      { ...DEFAULT_EXPLORE_FILTERS, visitStatus: ['nao-visitado'] },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['b'])
  })

  it('filtra apenas favoritos quando marcado', () => {
    const places = [
      place({ id: 'a', isFavorite: true }),
      place({ id: 'b', isFavorite: false }),
    ]
    const result = filterPlaces(
      places,
      { ...DEFAULT_EXPLORE_FILTERS, favoritesOnly: true },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['a'])
  })

  it('combina filtros com E, não com OU', () => {
    const places = [
      place({ id: 'a', category: 'serra', isFavorite: true }),
      place({ id: 'b', category: 'serra', isFavorite: false }),
      place({ id: 'c', category: 'praia', isFavorite: true }),
    ]
    const result = filterPlaces(
      places,
      { ...DEFAULT_EXPLORE_FILTERS, categories: ['serra'], favoritesOnly: true },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['a'])
  })

  it('não muta o array recebido', () => {
    const places = [place({ id: 'a' })]
    filterPlaces(places, { ...DEFAULT_EXPLORE_FILTERS, radiusKm: 1 }, ORIGIN)
    expect(places).toHaveLength(1)
  })
})

describe('mostRestrictiveCriterion', () => {
  const places = [
    place({ id: 'a', category: 'serra', visitStatus: 'visitado' }),
    place({ id: 'b', category: 'serra', visitStatus: 'nao-visitado' }),
    place({ id: 'c', category: 'praia', visitStatus: 'nao-visitado' }),
  ]

  it('devolve null quando não há filtro nenhum ativo', () => {
    expect(
      mostRestrictiveCriterion(places, DEFAULT_EXPLORE_FILTERS, ORIGIN),
    ).toBeNull()
  })

  it('aponta o critério que sozinho devolve mais lugares', () => {
    // Categoria "cafe" (0 lugares) somada a "visitado" (1 lugar): remover a
    // categoria devolve 1, remover a situação devolve 0.
    const relaxation = mostRestrictiveCriterion(
      places,
      {
        ...DEFAULT_EXPLORE_FILTERS,
        categories: ['cafe'],
        visitStatus: ['visitado'],
      },
      ORIGIN,
    )

    expect(relaxation?.criterion).toBe('categories')
    expect(relaxation?.recovered).toBe(1)
  })

  it('entrega os filtros já com o critério removido, prontos para aplicar', () => {
    const relaxation = mostRestrictiveCriterion(
      places,
      { ...DEFAULT_EXPLORE_FILTERS, categories: ['cafe'] },
      ORIGIN,
    )

    expect(relaxation?.filters.categories).toEqual([])
  })

  it('devolve null quando nenhum critério isolado resolve', () => {
    const relaxation = mostRestrictiveCriterion(
      places,
      {
        ...DEFAULT_EXPLORE_FILTERS,
        categories: ['cafe'],
        favoritesOnly: true,
      },
      ORIGIN,
    )

    expect(relaxation).toBeNull()
  })
})

describe('countActiveCriteria', () => {
  it('não conta nada no recorte padrão', () => {
    expect(countActiveCriteria(DEFAULT_EXPLORE_FILTERS)).toBe(0)
  })

  // Conta critérios, não valores: três categorias marcadas continuam sendo uma
  // restrição de categoria. É o número que a trilha mostra recolhida.
  it('conta o critério uma vez, por mais valores que ele tenha', () => {
    expect(
      countActiveCriteria({
        ...DEFAULT_EXPLORE_FILTERS,
        categories: ['praia', 'serra', 'mirante'],
      }),
    ).toBe(1)
  })

  it('soma critérios de naturezas diferentes', () => {
    expect(
      countActiveCriteria({
        categories: ['praia'],
        radiusKm: 100,
        visitStatus: ['visitado'],
        favoritesOnly: true,
        search: '',
      }),
    ).toBe(4)
  })

  // O número aparece no botão "Filtrar", e a busca tem campo próprio, fora dele.
  // Contá-la daria um "1" que não corresponde a nada dentro do painel aberto.
  it('não conta a busca, que não mora no painel de filtros', () => {
    expect(
      countActiveCriteria({ ...DEFAULT_EXPLORE_FILTERS, search: 'serra' }),
    ).toBe(0)
  })
})

describe('describeFilters', () => {
  it('devolve lista vazia sem restrição nenhuma', () => {
    expect(describeFilters(DEFAULT_EXPLORE_FILTERS, CATEGORY_LABELS)).toEqual([])
  })

  // A ordem é categoria, distância, situação, favoritos — a ordem em que a
  // pessoa pensa a viagem, não a ordem do objeto.
  it('descreve na ordem em que a viagem é pensada', () => {
    expect(
      describeFilters(
        {
          favoritesOnly: true,
          visitStatus: ['nao-visitado'],
          radiusKm: 150,
          categories: ['cachoeira'],
          search: '',
        },
        CATEGORY_LABELS,
      ),
    ).toEqual(['Cachoeira', 'até 150 km', 'Não visitados', 'Favoritos'])
  })

  it('não repete a busca, que já está escrita no campo', () => {
    expect(
      describeFilters(
        { ...DEFAULT_EXPLORE_FILTERS, search: 'urubici' },
        CATEGORY_LABELS,
      ),
    ).toEqual([])
  })

  it('usa os rótulos de interface das categorias', () => {
    expect(
      describeFilters(
        { ...DEFAULT_EXPLORE_FILTERS, categories: ['ponto_turistico'] },
        CATEGORY_LABELS,
      ),
    ).toEqual(['Ponto turístico'])
  })
})

describe('normalizeForSearch', () => {
  it('tira acento e caixa', () => {
    expect(normalizeForSearch('Lagoa da Conceição')).toBe('lagoa da conceicao')
    expect(normalizeForSearch('Guarda do Embaú')).toBe('guarda do embau')
    expect(normalizeForSearch('  SERRA  ')).toBe('serra')
  })
})

describe('matchesSearch', () => {
  const serra = place({
    name: 'Serra do Rio do Rastro',
    municipality: 'Bom Jardim da Serra',
    tags: ['curvas', 'mirante'],
  })

  it('acha sem acento o que tem acento', () => {
    // Ninguém digita acento com luva, parado no acostamento.
    const lagoa = place({ name: 'Lagoa da Conceição', municipality: 'Floripa' })

    expect(matchesSearch(lagoa, 'conceicao')).toBe(true)
    expect(matchesSearch(lagoa, 'CONCEIÇÃO')).toBe(true)
  })

  it('acha por pedaço do nome', () => {
    expect(matchesSearch(serra, 'rastro')).toBe(true)
  })

  it('acha pelo município', () => {
    expect(matchesSearch(serra, 'bom jardim')).toBe(true)
  })

  it('acha pela etiqueta', () => {
    // É assim que se procura o que se quer sem lembrar o nome.
    expect(matchesSearch(serra, 'curvas')).toBe(true)
  })

  it('termo vazio não restringe nada', () => {
    expect(matchesSearch(serra, '')).toBe(true)
    expect(matchesSearch(serra, '   ')).toBe(true)
  })

  it('recusa o que não casa', () => {
    expect(matchesSearch(serra, 'praia')).toBe(false)
  })
})
