import type { Coordinates } from '@/domain/geo'

/**
 * Como a foto foi encontrada. Muda o que o produto pode afirmar sobre ela.
 *
 * - `coordenada` — o arquivo tem GPS e caiu dentro do raio. Dá para dizer a
 *   distância, e a distância é um fato.
 * - `nome` — o arquivo casou com o nome do lugar na busca do Commons. **Não há
 *   distância**, e o casamento é por texto: procurar "Santo Amaro da Imperatriz"
 *   devolve o hospital do município junto. Medido.
 *
 * As duas convivem porque uma sozinha não serve: por coordenada, dez dos catorze
 * lugares do catálogo não têm foto nenhuma; por nome, todos têm. O que não pode
 * é apresentar as duas como a mesma coisa.
 */
export type CommonsMatch = 'coordenada' | 'nome'

/** Uma fotografia do Wikimedia Commons, com a procedência junto. */
export interface CommonsPhoto {
  match: CommonsMatch
  /** Título do arquivo no Commons. Serve de chave. */
  id: string
  /** URL da miniatura, já redimensionada pelo próprio Commons. */
  thumbnailUrl: string
  /** Página do arquivo no Commons — onde a licença pode ser conferida. */
  descriptionUrl: string
  /** Autor, em texto simples. `null` quando o arquivo não declara. */
  author: string | null
  /** Nome curto da licença, ex.: `'CC BY-SA 4.0'`. */
  license: string | null
  /** Metros entre a foto e o lugar. `null` quando veio pelo nome. */
  distanceM: number | null
  /** Nome do arquivo, sem o `File:`. É o que descreve a foto achada pelo nome. */
  title: string
}

/**
 * Uma função, e `[]` como única forma de falha.
 *
 * A implementação NUNCA lança: rede fora, resposta inesperada ou lugar sem foto
 * nenhuma devolvem lista vazia, e o painel simplesmente não mostra a seção.
 */
export interface CommonsClient {
  /**
   * Fotos do lugar: primeiro as que têm coordenada, depois as que casam pelo
   * nome. `name` é obrigatório porque, sem ele, dez dos catorze lugares do
   * catálogo não teriam foto nenhuma.
   */
  forPlace(point: Coordinates, name: string): Promise<CommonsPhoto[]>
}
