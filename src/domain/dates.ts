const MONTHS = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
] as const

/**
 * `'2026-07-26'` → `'26 JUL 2026'`.
 *
 * O parse é manual de propósito: `new Date('2026-07-26')` é interpretado como
 * meia-noite UTC e, no fuso de Brasília, exibiria o dia anterior. Datas de
 * visita são datas de calendário, não instantes.
 */
export function formatVisitDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return ''

  const [, year, month, day] = match
  const monthLabel = MONTHS[Number(month) - 1]
  if (!monthLabel) return ''

  return `${day} ${monthLabel} ${year}`
}
