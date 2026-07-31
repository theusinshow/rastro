import type { Coordinates, RoutePosition } from '@/domain/geo'
import type { RoutedLine, RoutingClient } from './routing-client'

const ENDPOINT =
  'https://api.openrouteservice.org/v2/directions/driving-car/geojson'

/** Acima disso o provedor recusa, e a viagem de um dia nunca chega perto. */
const MAX_POINTS = 50

/** Rede lenta não pode travar o salvamento de uma viagem. */
const TIMEOUT_MS = 8000

/**
 * Raio de encaixe de cada parada na malha viária, em metros.
 *
 * O padrão do provedor é 350 m, e ele recusa a rota INTEIRA com HTTP 404 quando
 * um único ponto cai fora disso. Isso não é caso raro aqui: mirante, cachoeira e
 * praia costumam ficar longe do asfalto, e a coordenada de um lugar aponta para o
 * lugar, não para a estrada que leva a ele.
 *
 * Com 350 m, uma parada assim derrubaria a viagem toda para o modo estimado, em
 * silêncio. Verificado contra a API real: um ponto de serra a mais de 350 m de
 * estrada devolve 404 no padrão e 200 com este raio.
 */
const SNAP_RADIUS_M = 5000

interface OrsResponse {
  features?: {
    geometry?: { type?: string; coordinates?: unknown }
    properties?: { summary?: { distance?: unknown; duration?: unknown } }
  }[]
}

/**
 * Aceita pares e trincas: com `elevation` ligado o ORS devolve
 * `[longitude, latitude, metros]`, e a altitude é opcional por contrato — se um
 * dia vier sem ela, o perfil some e a rota continua.
 */
function isRoutePositions(value: unknown): value is RoutePosition[] {
  return (
    Array.isArray(value) &&
    value.every(
      (position) =>
        Array.isArray(position) &&
        position.length >= 2 &&
        position.every((n) => typeof n === 'number'),
    )
  )
}

/**
 * Traduz a resposta do ORS.
 *
 * Devolve `null` a qualquer sinal de que o corpo não é o que se espera, em vez de
 * confiar num `as` e explodir mais adiante com um erro que não aponta para aqui.
 */
function toRoutedLine(body: unknown): RoutedLine | null {
  const feature = (body as OrsResponse)?.features?.[0]
  const coordinates = feature?.geometry?.coordinates
  const summary = feature?.properties?.summary

  if (feature?.geometry?.type !== 'LineString') return null
  if (!isRoutePositions(coordinates)) return null
  if (typeof summary?.distance !== 'number') return null
  if (typeof summary?.duration !== 'number') return null

  return {
    geometry: { type: 'LineString', coordinates },
    roadKm: summary.distance / 1000,
    minutes: summary.duration / 60,
  }
}

export function createOpenRouteServiceClient(apiKey: string): RoutingClient {
  return {
    async route(points) {
      if (points.length < 2 || points.length > MAX_POINTS) return null

      try {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json',
          },
          // O ORS recebe `[longitude, latitude]`, na ordem inversa da nossa.
          body: JSON.stringify({
            coordinates: points.map((point: Coordinates) => [
              point.longitude,
              point.latitude,
            ]),
            radiuses: points.map(() => SNAP_RADIUS_M),
            // Cada ponto do traçado passa a vir com a altitude em metros. É o
            // que permite dizer, antes de sair de casa, quanto a serra sobe.
            elevation: true,
          }),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        })

        if (!response.ok) return null
        return toRoutedLine(await response.json())
      } catch {
        // Rede, timeout, JSON inválido: tudo vira `null`. O chamador cai no modo
        // estimado, e o usuário perde precisão, não a viagem.
        return null
      }
    },
  }
}
