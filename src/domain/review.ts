/**
 * Nota e relato — o "como foi" de uma viagem ou de uma visita.
 *
 * As colunas `rating` e `notes` existem em `trips` e em `place_visits` desde a
 * primeira migration e nenhuma tela as usava. Sem elas o produto registrava
 * QUE você foi, e não COMO foi — deixando pela metade a única das quatro
 * perguntas do `CLAUDE.md` sobre histórias.
 */
export const MAX_NOTE_LENGTH = 2000

/**
 * A estrela sozinha não diz nada: 4 de 5 é bom ou decepcionante? Nomear cada
 * degrau é o que transforma um número numa opinião legível daqui a cinco anos.
 */
export const RATING_LABELS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'não valeu',
  2: 'fraca',
  3: 'boa',
  4: 'muito boa',
  5: 'daquelas que ficam',
}

/** `null` é válido: não dar nota é uma resposta, não um campo em branco. */
export function isValidRating(rating: number | null): boolean {
  if (rating === null) return true
  return Number.isInteger(rating) && rating >= 1 && rating <= 5
}

/**
 * Apara e trunca. **Nunca recusa.**
 *
 * Perder o fim de um relato muito longo é ruim; perder o relato inteiro por
 * causa de um erro de validação, depois de a pessoa ter escrito, é pior.
 *
 * Vazio vira `null` porque os dois significam a mesma coisa, e guardar ambos
 * faria toda leitura tratar dois casos para nada.
 */
export function normalizeNote(note: string | null): string | null {
  if (note === null) return null
  const trimmed = note.trim()
  if (trimmed.length === 0) return null
  return trimmed.slice(0, MAX_NOTE_LENGTH)
}
