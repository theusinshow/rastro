import type { Coordinates } from '@/domain/geo'

/** Um lugar encontrado pela busca de endereço. */
export interface GeocodedPlace {
  /** Nome pronto para virar o rótulo da origem. Ex.: `'Palhoça, Santa Catarina'`. */
  label: string
  coordinates: Coordinates
}

/**
 * Uma função, e `[]` como única forma de falha.
 *
 * Sem chave, rede fora, resposta inesperada: tudo vira lista vazia, e a interface
 * cai no que sempre funcionou — clicar no mapa. Buscar endereço é conveniência;
 * o clique é a garantia.
 *
 * A implementação NUNCA lança.
 */
export interface GeocodingClient {
  search(query: string): Promise<GeocodedPlace[]>
}
