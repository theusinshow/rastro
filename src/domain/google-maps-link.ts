import type { Coordinates } from './geo'

/**
 * URL de rota no Google Maps com as paradas como waypoints.
 *
 * Esta função é a fronteira declarada do produto: o Rastro escolhe as paradas, o
 * Google traça o caminho entre elas. É por isso que não existe motor de navegação
 * aqui — competir com o Google em curva-a-curva seria entregar uma versão pior do
 * que qualquer pessoa já tem no bolso.
 *
 * A origem aparece duas vezes de propósito: o passeio sai de casa e volta para
 * casa, então ela é partida e destino.
 */
export function googleMapsRouteUrl(
  origin: Coordinates,
  stops: readonly Coordinates[],
): string {
  const point = (coordinates: Coordinates) =>
    `${coordinates.latitude},${coordinates.longitude}`

  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('travelmode', 'driving')
  url.searchParams.set('origin', point(origin))
  url.searchParams.set('destination', point(origin))

  if (stops.length > 0) {
    url.searchParams.set('waypoints', stops.map(point).join('|'))
  }

  return url.toString()
}
