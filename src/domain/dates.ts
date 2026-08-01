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

/**
 * Data civil `YYYY-MM-DD` de um instante, no fuso informado.
 *
 * Existe porque `place_visits.visited_at` é `date` e `trips.ended_at` é
 * `timestamptz`. Converter no fuso errado registra a visita no dia ANTERIOR: uma
 * viagem encerrada às 23h30 em Brasília é 02h30 do dia seguinte em UTC, e a
 * memória apareceria no mapa na data errada.
 *
 * É a mesma armadilha do `formatVisitDate` acima, agora no sentido inverso.
 * `Intl` sabe fuso e horário de verão; fazer a conta com deslocamento fixo de
 * três horas voltaria a errar sempre que a regra mudasse.
 */
export function civilDateInTimeZone(
  instantIso: string,
  timeZone: string,
): string {
  // `en-CA` formata como `YYYY-MM-DD`, que é exatamente o formato do banco.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(instantIso))
}

/**
 * `08:35` — hora e minuto, no relógio de quem está lendo.
 *
 * Sem segundos e sem AM/PM: o produto é brasileiro e a leitura acontece de
 * relance, com o capacete na mão. Formata no fuso do aparelho de propósito —
 * quem pergunta "a que horas eu volto" quer a resposta no relógio do pulso, não
 * em UTC.
 */
export function formatClock(instant: Date): string {
  const horas = String(instant.getHours()).padStart(2, '0')
  const minutos = String(instant.getMinutes()).padStart(2, '0')
  return `${horas}:${minutos}`
}
