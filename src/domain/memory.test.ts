import { describe, expect, it } from 'vitest'
import { groupByMonth, monthLabel } from './memory'
import type { MemoryEntry } from './memory'

function visita(id: string, on: string): MemoryEntry {
  return { id, kind: 'visit', on, title: `Lugar ${id}`, subtitle: null, href: '/' }
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
