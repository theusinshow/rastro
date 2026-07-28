/** Base usada quando o nome não produz nenhum caractere aproveitável. */
const FALLBACK_SLUG = 'lugar'

/**
 * Nome legível para identificador de URL.
 *
 * `NFD` + remoção da faixa de marcas diacríticas resolve acentuação sem tabela
 * de substituição e sem dependência — é o mesmo caminho que o resto do projeto
 * escolheu ao recusar bibliotecas para trabalho pequeno.
 */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    // Faixa das marcas diacríticas combinantes, escapada de propósito: o
    // caractere literal não sobrevive a cópia entre editores.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Primeiro slug livre a partir de uma base.
 *
 * `taken` é a lista de slugs que já existem. O sufixo começa em 2 porque
 * `nome-1` sugeriria que existe um `nome-0`.
 */
export function uniqueSlug(base: string, taken: readonly string[]): string {
  const start = base || FALLBACK_SLUG
  const used = new Set(taken)
  if (!used.has(start)) return start

  let suffix = 2
  while (used.has(`${start}-${suffix}`)) {
    suffix += 1
  }
  return `${start}-${suffix}`
}
