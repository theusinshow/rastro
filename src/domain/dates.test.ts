import { describe, expect, it } from 'vitest'
import { formatVisitDate } from './dates'

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
