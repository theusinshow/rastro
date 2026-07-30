import type { ExplorePlace } from './place'

/**
 * Pontuação de interesse de um lugar como parada de um roteiro.
 *
 * Esta é a informação que o Rastro tem e um otimizador genérico não: o que você
 * marcou como quero-conhecer, o que ainda não viu, e há quanto tempo não volta.
 * É por isso que a ORDEM das paradas pode ser delegada à geometria, mas a
 * ESCOLHA delas não.
 */
export const SCORE_WANTS_TO_VISIT = 100
export const SCORE_UNVISITED = 60
export const SCORE_VISITED = 20
export const SCORE_FAVORITE_BONUS = 25

/** Máximo que a idade da última visita soma a um lugar já visitado. */
export const SCORE_STALENESS_MAX = 30

/** A partir daqui a visita é "antiga" e o bônus para de crescer. */
export const STALENESS_SATURATION_MONTHS = 24

const DAYS_PER_MONTH = 30.44
const MS_PER_DAY = 86_400_000

/**
 * Meses inteiros entre duas datas civis `YYYY-MM-DD`.
 *
 * O parse ancora ao meio-dia UTC pelo mesmo motivo do `dates.ts`:
 * `new Date('2026-07-26')` é meia-noite UTC e, no fuso de Brasília, cai no dia
 * anterior. Isto é conta de calendário, e o meio-dia deixa a diferença imune a
 * qualquer deslocamento de fuso.
 */
function monthsBetween(fromIsoDate: string, toIsoDate: string): number {
  const from = Date.parse(`${fromIsoDate}T12:00:00Z`)
  const to = Date.parse(`${toIsoDate}T12:00:00Z`)
  if (Number.isNaN(from) || Number.isNaN(to)) return 0

  const days = (to - from) / MS_PER_DAY
  return Math.max(0, days / DAYS_PER_MONTH)
}

/**
 * Voltar a um lugar tem valor, e voltar a um lugar que você não vê há dois anos
 * tem mais. Satura de propósito: sem teto, um lugar visitado em 1990 venceria um
 * quero-conhecer, e o roteiro deixaria de servir a quem quer conhecer coisa nova.
 *
 * `today` é `YYYY-MM-DD` e entra por parâmetro, não de `new Date()` aqui: é o que
 * mantém a função pura e testável.
 */
export function scorePlace(place: ExplorePlace, today: string): number {
  let score = 0

  if (place.visitStatus === 'quero-conhecer') {
    score += SCORE_WANTS_TO_VISIT
  } else if (place.visitStatus === 'nao-visitado') {
    score += SCORE_UNVISITED
  } else {
    score += SCORE_VISITED
    if (place.lastVisitedAt) {
      const months = monthsBetween(place.lastVisitedAt, today)
      const ratio = Math.min(1, months / STALENESS_SATURATION_MONTHS)
      score += ratio * SCORE_STALENESS_MAX
    }
  }

  if (place.isFavorite) score += SCORE_FAVORITE_BONUS

  return score
}
