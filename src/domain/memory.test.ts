import { describe, expect, it } from 'vitest'
import { groupByMonth, monthLabel, mostRecentYear, summarizeYear } from './memory'
import type { MemoryEntry } from './memory'

function visita(id: string, on: string, placeSlug = `lugar-${id}`): MemoryEntry {
  return {
    id,
    kind: 'visit',
    on,
    title: `Lugar ${id}`,
    subtitle: null,
    href: '/',
    placeSlug,
  }
}

function viagem(id: string, on: string | null, distanceKm: number | null): MemoryEntry {
  return {
    id,
    kind: 'trip',
    on,
    title: `Volta ${id}`,
    subtitle: null,
    href: '/',
    distanceKm,
  }
}

function foto(id: string, on: string | null): MemoryEntry {
  return { id, kind: 'photo', on, title: 'Foto', subtitle: null, href: '/' }
}

describe('monthLabel', () => {
  it('escreve mês e ano por extenso, em minúsculas', () => {
    expect(monthLabel('2026-03')).toBe('março de 2026')
    expect(monthLabel('2024-12')).toBe('dezembro de 2024')
  })

  it('devolve a própria chave quando ela não é um mês', () => {
    expect(monthLabel('lixo')).toBe('lixo')
  })
})

describe('groupByMonth', () => {
  it('agrupa por ano e mês', () => {
    const grupos = groupByMonth([
      visita('a', '2026-03-15'),
      visita('b', '2026-03-02'),
      visita('c', '2026-01-20'),
    ])

    expect(grupos).toHaveLength(2)
    expect(grupos[0]?.month).toBe('2026-03')
    expect(grupos[0]?.entries).toHaveLength(2)
    expect(grupos[1]?.month).toBe('2026-01')
  })

  it('ordena do mais recente para o mais antigo, dentro e fora do mês', () => {
    const grupos = groupByMonth([
      visita('velha', '2024-05-01'),
      visita('nova', '2026-07-30'),
      visita('meio', '2026-07-02'),
    ])

    expect(grupos.map((g) => g.month)).toEqual(['2026-07', '2024-05'])
    expect(grupos[0]?.entries.map((e) => e.id)).toEqual(['nova', 'meio'])
  })

  it('entrada sem data vai para um grupo próprio, no fim', () => {
    // Foto sem EXIF cai aqui. Ela NÃO é jogada no mês de hoje: a data em que
    // você subiu o arquivo não é a data em que aquilo aconteceu.
    const grupos = groupByMonth([
      { ...visita('semdata', '2026-01-01'), on: null },
      visita('comdata', '2020-01-01'),
    ])

    expect(grupos[grupos.length - 1]?.month).toBeNull()
    expect(grupos[grupos.length - 1]?.entries.map((e) => e.id)).toEqual([
      'semdata',
    ])
  })

  it('lista vazia devolve nenhum grupo', () => {
    expect(groupByMonth([])).toEqual([])
  })

  it('não cria mês vazio entre dois meses com conteúdo', () => {
    // Não andar de moto em abril não é um fato a exibir.
    const grupos = groupByMonth([
      visita('a', '2026-05-10'),
      visita('b', '2026-03-10'),
    ])

    expect(grupos.map((g) => g.month)).toEqual(['2026-05', '2026-03'])
  })
})

describe('mostRecentYear', () => {
  it('devolve o ano mais recente com alguma coisa registrada', () => {
    expect(
      mostRecentYear([visita('a', '2024-11-02'), visita('b', '2026-01-08')]),
    ).toBe('2026')
  })

  it('devolve null sem nada com data', () => {
    expect(mostRecentYear([])).toBeNull()
    expect(mostRecentYear([foto('a', null)])).toBeNull()
  })
})

describe('summarizeYear', () => {
  const entradas = [
    viagem('v1', '2026-03-14', 379),
    viagem('v2', '2026-03-28', 556),
    viagem('v3', '2026-05-02', null),
    visita('a', '2026-03-14', 'serra-do-rio-do-rastro'),
    visita('b', '2026-03-15', 'urubici'),
    visita('c', '2026-05-02', 'serra-do-rio-do-rastro'),
    foto('f1', '2026-03-14'),
    foto('f2', '2026-05-02'),
    foto('f3', null),
    visita('velha', '2025-12-30', 'guarda-do-embau'),
  ]

  it('devolve null para um ano sem nada', () => {
    expect(summarizeYear(entradas, '2019')).toBeNull()
  })

  it('conta viagens, lugares distintos e fotos do ano', () => {
    const ano = summarizeYear(entradas, '2026')

    expect(ano?.tripCount).toBe(3)
    // A Serra aparece duas vezes; é um lugar, não dois.
    expect(ano?.placeCount).toBe(2)
    expect(ano?.photoCount).toBe(2)
  })

  it('soma só as viagens medidas, e diz quantas foram', () => {
    // Sem `measuredTrips`, "935 km" pareceria o total de três viagens quando
    // saiu de duas.
    const ano = summarizeYear(entradas, '2026')

    expect(ano?.distanceKm).toBe(935)
    expect(ano?.measuredTrips).toBe(2)
  })

  it('aponta o mês com mais coisa registrada', () => {
    expect(summarizeYear(entradas, '2026')?.busiestMonth).toBe('2026-03')
  })

  it('no empate fica com o mês mais recente', () => {
    const ano = summarizeYear(
      [visita('a', '2026-02-01'), visita('b', '2026-09-01')],
      '2026',
    )

    expect(ano?.busiestMonth).toBe('2026-09')
  })

  it('não elege mês mais cheio quando só houve um mês', () => {
    const ano = summarizeYear(
      [visita('a', '2026-07-28'), visita('b', '2026-07-28', 'guarda-do-embau')],
      '2026',
    )

    expect(ano?.busiestMonth).toBeNull()
    expect(ano?.placeCount).toBe(2)
  })

  it('não deixa o ano anterior vazar para dentro da conta', () => {
    expect(summarizeYear(entradas, '2025')?.placeCount).toBe(1)
  })

  it('ignora o que não tem data em vez de chutar o ano', () => {
    // Foto sem EXIF não pertence a ano nenhum.
    expect(summarizeYear([foto('sem', null)], '2026')).toBeNull()
  })
})

