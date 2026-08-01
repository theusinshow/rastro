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
  /**
   * Coordenada → nome do lugar. O caminho inverso da busca.
   *
   * Existe para a geolocalização do aparelho: ela entrega latitude e longitude,
   * e "-27.6448, -48.6646" não é um ponto de partida que alguém reconheça na
   * lista de viagens seis meses depois.
   *
   * Falha como o resto deste módulo: `null`, nunca exceção. Sem nome, a
   * interface usa um rótulo genérico e a origem continua utilizável — perder o
   * nome não pode custar a coordenada, que é o dado que importa.
   */
  reverse(coordinates: Coordinates): Promise<string | null>
}
