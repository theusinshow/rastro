import type { Coordinates } from '@/domain/geo'

/** Uma fotografia do Wikimedia Commons, com a procedência junto. */
export interface CommonsPhoto {
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
  /** Metros entre a foto e o lugar consultado. */
  distanceM: number
}

/**
 * Uma função, e `[]` como única forma de falha.
 *
 * A implementação NUNCA lança: rede fora, resposta inesperada ou lugar sem foto
 * nenhuma devolvem lista vazia, e o painel simplesmente não mostra a seção.
 */
export interface CommonsClient {
  nearby(point: Coordinates): Promise<CommonsPhoto[]>
}
