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

/**
 * Rota de um ponto só: daqui até ali, sem volta.
 *
 * O irmão de ida e volta acima serve ao passeio, que sai de casa e volta para
 * casa. Este serve ao trecho: o posto de combustível é uma parada no meio do
 * caminho, e ninguém quer voltar para casa depois de abastecer.
 *
 * `origin` é opcional porque a partida pode não existir — quem ainda não definiu
 * origem no perfil continua tendo a rota, e o Google usa a localização do
 * aparelho como faz em qualquer link de direção. Fabricar uma partida aqui
 * traçaria uma rota a partir de um lugar que não é o de ninguém.
 */
export function googleMapsDirectionUrl(
  destination: Coordinates,
  origin: Coordinates | null = null,
): string {
  const point = (coordinates: Coordinates) =>
    `${coordinates.latitude},${coordinates.longitude}`

  const url = new URL('https://www.google.com/maps/dir/')
  url.searchParams.set('api', '1')
  url.searchParams.set('travelmode', 'driving')
  if (origin) url.searchParams.set('origin', point(origin))
  url.searchParams.set('destination', point(destination))

  return url.toString()
}
