import {
  planRefuelStops,
  refuelPointsAlongRoute,
  type RefuelPoint,
} from '@/domain/fuel'
import {
  FUEL_RADIUS_DEFAULT_M,
  type FuelStation,
} from '@/domain/fuel-stations'
import type { TripDetail } from '@/domain/trip'
import { getFuelStationClient } from '@/lib/fuel-stations'
import { RouteFuelPanel } from './RouteFuelPanel'

/**
 * Quantos postos mostrar por parada.
 *
 * Quatro. Ninguém escolhe entre o quarto e o quinto posto de uma lista ordenada
 * por distância, e cada linha a mais empurra o resto do roteiro para baixo.
 */
const PER_STOP = 4

/**
 * Quantas paradas consultar.
 *
 * Cada uma é uma ida à Geoapify, e uma volta de 1.200 km numa moto de 300 pede
 * quatro. O teto existe para o custo não crescer com a ambição da viagem — e
 * quando ele morde, a tela **diz** que mordeu, em vez de mostrar três paradas
 * como se fossem todas.
 */
const MAX_STOPS = 3

export interface RefuelStopStations {
  atKm: number
  stations: FuelStation[]
}

/**
 * Onde abastecer nesta viagem — não quantas vezes, que o produto já dizia.
 *
 * Fecha o laço que `pointAtDistance` abriu e nunca teve consumidor: o plano de
 * abastecimento sabe que a volta pede uma parada por volta dos 255 km, o traçado
 * sabe que ponto do mapa é esse, e a busca de postos sabe o que tem em volta
 * dele. As três peças existiam separadas.
 *
 * Componente de SERVIDOR, como `RouteWeather`, e pela mesma razão: a chamada
 * externa nunca sai do navegador, e a resposta chega dentro do HTML da página em
 * vez de piscar depois. É por isso que ele fala com `getFuelStationClient()`
 * direto, e não com `/api/fuel-stations` — aquela rota existe para o navegador,
 * que precisa de cancelamento e cache por URL.
 *
 * **A falha aqui é silenciosa, e isso é deliberado.** No Explorar, quem apertou
 * "Postos" pediu uma coisa e precisa saber por que ela não veio. Aqui ninguém
 * pediu nada: a seção é um enriquecimento do roteiro, e sem ela a viagem
 * continua inteira. Mesmo contrato do `RouteWeather` — sem previsão, a página
 * perde um aviso, não a viagem.
 */
export async function RouteFuel({
  trip,
  autonomyKm,
}: {
  trip: TripDetail
  autonomyKm: number | null
}) {
  /*
   * Sem traçado gravado não há onde marcar a parada.
   *
   * A distância da viagem existiria mesmo assim — estimada pelo fator de
   * sinuosidade —, mas caminhar 255 km sobre uma linha reta entre paradas
   * marcaria um ponto onde não passa estrada nenhuma, e a busca devolveria os
   * postos de um vale ao lado. Melhor não responder do que responder errado.
   */
  if (!trip.routeGeoJson || trip.distanceKm === null) return null

  // `null` é "não sei qual é a sua moto", e aí o produto não opina.
  const plan = planRefuelStops(trip.distanceKm, autonomyKm)
  if (!plan || plan.fitsInOneTank) return null

  const points = refuelPointsAlongRoute(trip.routeGeoJson.coordinates, plan)
  if (points.length === 0) return null

  const client = getFuelStationClient()
  if (!client) return null

  const consulted = points.slice(0, MAX_STOPS)

  const results = await Promise.all(
    consulted.map(async (point: RefuelPoint) => {
      const outcome = await client.search({
        center: point.coordinates,
        radiusM: FUEL_RADIUS_DEFAULT_M,
        limit: PER_STOP,
      })
      // Uma parada que falhou não derruba as outras: a segunda continua
      // respondida mesmo se a primeira não voltar.
      if (!outcome.ok || outcome.stations.length === 0) return null
      return { atKm: point.atKm, stations: outcome.stations }
    }),
  )

  const stops = results.filter((stop): stop is RefuelStopStations => stop !== null)
  if (stops.length === 0) return null

  return (
    <RouteFuelPanel
      stops={stops}
      usableRangeKm={plan.usableRangeKm}
      // O que ficou de fora, para a tela poder dizer. Silenciar o teto faria
      // três paradas parecerem a viagem inteira.
      omitted={points.length - consulted.length}
    />
  )
}
