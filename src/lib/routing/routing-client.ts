import type { Coordinates, RoutePosition } from '@/domain/geo'

/** Traçado real da estrada entre uma sequência de pontos. */
export interface RoutedLine {
  /**
   * `LineString` em GeoJSON, coordenadas `[longitude, latitude]` e, quando o
   * provedor mede o relevo, a altitude em metros como terceiro valor.
   *
   * Vai direto para `trips.route_geojson` e para uma fonte do MapLibre, sem
   * conversão. É por isso que o provedor escolhido devolve GeoJSON nativamente —
   * e o MapLibre ignora o terceiro valor sozinho.
   */
  geometry: { type: 'LineString'; coordinates: RoutePosition[] }
  roadKm: number
  minutes: number
}

/**
 * Uma função, um retorno, e `null` como ÚNICA forma de falha.
 *
 * `null` cobre tudo: sem chave, rede fora, cota estourada, resposta inesperada.
 * Isso faz o modo degradado ser um `if` no chamador, e não um segundo caminho de
 * código — o produto continua funcionando com a estimativa de sinuosidade que o
 * domínio já calcula.
 *
 * A implementação NUNCA lança.
 */
export interface RoutingClient {
  route(points: readonly Coordinates[]): Promise<RoutedLine | null>
}
