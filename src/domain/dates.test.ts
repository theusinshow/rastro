import { describe, expect, it } from 'vitest'
import { civilDateInTimeZone, formatVisitDate } from './dates'

describe('formatVisitDate', () => {
  it('formata no vocabulário de diário de viagem', () => {
    expect(formatVisitDate('2026-07-26')).toBe('26 JUL 2026')
  })

  it('preserva o dia independentemente do fuso', () => {
    // `new Date('2026-01-01')` é meia-noite UTC e voltaria 31 DEZ 2025 no
    // horário de Brasília. O parse precisa ser manual.
    expect(formatVisitDate('2026-01-01')).toBe('01 JAN 2026')
  })

  it('mantém dois dígitos no dia', () => {
    expect(formatVisitDate('2026-03-05')).toBe('05 MAR 2026')
  })

  it('devolve string vazia para entrada inválida', () => {
    expect(formatVisitDate('não é data')).toBe('')
  })
})

describe('civilDateInTimeZone', () => {
  it('às 23h30 de Brasília, a data é o dia da viagem, não o dia seguinte em UTC', () => {
    // 2026-07-30T23:30 em -03:00 é 2026-07-31T02:30Z.
    expect(
      civilDateInTimeZone('2026-07-31T02:30:00.000Z', 'America/Sao_Paulo'),
    ).toBe('2026-07-30')
  })

  it('à 01h de Brasília, continua sendo o dia em Brasília', () => {
    expect(
      civilDateInTimeZone('2026-07-30T04:00:00.000Z', 'America/Sao_Paulo'),
    ).toBe('2026-07-30')
  })

  it('em UTC, a data é a própria', () => {
    expect(civilDateInTimeZone('2026-07-31T02:30:00.000Z', 'UTC')).toBe(
      '2026-07-31',
    )
  })

  it('o resultado alimenta o formatVisitDate sem conversão no meio', () => {
    const civil = civilDateInTimeZone(
      '2026-07-31T02:30:00.000Z',
      'America/Sao_Paulo',
    )

    expect(formatVisitDate(civil)).toBe('30 JUL 2026')
  })
})
