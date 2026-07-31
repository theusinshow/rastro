import type { LineLayerSpecification } from 'maplibre-gl'
import type { TripDetail } from '@/domain/trip'

export const TRIP_ROUTE_SOURCE_ID = 'trip-route'

const ASPHALT_LAYER_ID = 'trip-route-asphalt'
const CENTERLINE_LAYER_ID = 'trip-route-centerline'

/** Na ordem de remoção: a faixa central sai antes do asfalto que ela corta. */
export const TRIP_ROUTE_LAYERS = [
  CENTERLINE_LAYER_ID,
  ASPHALT_LAYER_ID,
] as const

/**
 * Cores em hex literal espelhando `globals.css` à mão: MapLibre desenha em WebGL e
 * não lê variável CSS. Mudar uma sem a outra faz interface e mapa divergirem.
 * Paleta do ADR 0012.
 */
const ASPHALT = '#e5a338'
const CENTERLINE = '#0e0d0c'

/**
 * A rota é desenhada como a MARCA: traço âmbar com faixa central tracejada na cor
 * do fundo. É o único lugar do produto onde a geometria da identidade vira
 * informação literal.
 *
 * Também resolve a leitura: as vias do mapa base são osso (`#c2b9a7`) e os pins
 * são círculos, então a rota não compete com nenhum dos dois.
 */
export function buildTripRouteLayers(): LineLayerSpecification[] {
  return [
    {
      id: ASPHALT_LAYER_ID,
      type: 'line',
      source: TRIP_ROUTE_SOURCE_ID,
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ASPHALT,
        'line-width': ['interpolate', ['linear'], ['zoom'], 6, 3, 14, 8],
      },
    },
    {
      id: CENTERLINE_LAYER_ID,
      type: 'line',
      source: TRIP_ROUTE_SOURCE_ID,
      layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': CENTERLINE,
        'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.7, 14, 1.6],
        // `line-dasharray` é em múltiplos da LARGURA da linha, não em pixels.
        // 4.5/5.5 e não 2/3: o tracejado curto lia como pontilhado, e a faixa
        // precisa ser a MESMA da régua de "estimado" e da perna da marca — é o
        // que faz o traçado no mapa e o número na tela contarem a mesma coisa.
        'line-dasharray': [4.5, 5.5],
      },
    },
  ]
}

function toLngLat(point: {
  latitude: number
  longitude: number
}): [number, number] {
  return [point.longitude, point.latitude]
}

/**
 * Traçado real quando houver; senão, linha reta entre as paradas.
 *
 * A linha reta é honesta sobre o que é: sem `route_geojson` a distância também é
 * estimada, e o painel diz isso. Desenhar uma curva inventada seria pior que
 * desenhar o segmento que de fato foi medido.
 */
export function buildTripRouteGeoJson(
  detail: TripDetail,
): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  const origin = detail.originCoordinates
  // `Position` do GeoJSON e não um par: com altimetria, cada ponto do traçado
  // vem com um terceiro valor, que o MapLibre ignora ao desenhar.
  const coordinates: GeoJSON.Position[] = detail.routeGeoJson
    ? detail.routeGeoJson.coordinates
    : [
        ...(origin ? [toLngLat(origin)] : []),
        ...detail.stops.map((stop) => toLngLat(stop.coordinates)),
        ...(origin ? [toLngLat(origin)] : []),
      ]

  return {
    type: 'FeatureCollection',
    // Menos de dois pontos não é linha. Uma `LineString` de um ponto só é
    // GeoJSON inválido, e o MapLibre descartaria a fonte inteira em silêncio.
    features:
      coordinates.length >= 2
        ? [
            {
              type: 'Feature',
              properties: {},
              geometry: { type: 'LineString', coordinates },
            },
          ]
        : [],
  }
}
