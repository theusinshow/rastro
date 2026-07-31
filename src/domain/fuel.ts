import { haversineKm, type Coordinates } from './geo'

/**
 * Autonomia é UM número, informado por quem pilota — não tanque mais consumo.
 *
 * Quem anda de moto sabe dizer "a minha faz uns 300 com um tanque" com bem mais
 * confiança do que sabe o consumo exato. Pedir duas medidas para chegar a uma
 * seria transferir ao usuário uma conta que ele já fez na estrada.
 */
export const MIN_AUTONOMY_KM = 50
export const MAX_AUTONOMY_KM = 900

/**
 * Fração da autonomia que se planeja usar entre abastecimentos.
 *
 * Rodar até a última gota não é plano, é aposta — e na serra catarinense o posto
 * seguinte pode estar fechado, sem energia ou a 40 km. 15% de reserva é o que
 * separa um contratempo de uma noite no acostamento.
 */
export const REFUEL_SAFETY_MARGIN = 0.85

export function isValidAutonomy(km: number): boolean {
  return (
    Number.isInteger(km) && km >= MIN_AUTONOMY_KM && km <= MAX_AUTONOMY_KM
  )
}

export interface RefuelPlan {
  /** Quantas vezes será preciso abastecer no meio do caminho. */
  stops: number
  fitsInOneTank: boolean
  /** Autonomia já descontada a reserva. */
  usableRangeKm: number
  /** Quilometragem de cada parada, contada desde a partida. */
  atKm: number[]
}

/**
 * Quantas paradas para abastecer uma volta exige.
 *
 * `null` quando a autonomia não foi informada — e aí o produto **não opina**.
 * Chutar uma autonomia média seria inventar dado sobre a moto de outra pessoa,
 * que é justamente o que este produto não faz.
 */
export function planRefuelStops(
  totalRoadKm: number,
  autonomyKm: number | null,
): RefuelPlan | null {
  if (autonomyKm === null || !isValidAutonomy(autonomyKm)) return null

  const usableRangeKm = Math.round(autonomyKm * REFUEL_SAFETY_MARGIN)
  const stops = Math.max(0, Math.ceil(totalRoadKm / usableRangeKm) - 1)

  return {
    stops,
    fitsInOneTank: stops === 0,
    usableRangeKm,
    atKm: Array.from({ length: stops }, (_, i) => usableRangeKm * (i + 1)),
  }
}

/**
 * O ponto sobre uma linha a uma certa distância do começo.
 *
 * Serve para marcar no mapa **onde o tanque acaba**: com o traçado real da rota
 * e a autonomia, a posição sai de uma caminhada pela linha — sem serviço externo
 * nenhum.
 *
 * `coordinates` vem no formato GeoJSON, `[longitude, latitude]`.
 *
 * Devolve `null` quando a distância passa do fim da linha. **Nunca extrapola:**
 * inventar um ponto fora da rota marcaria o tanque acabando num lugar por onde
 * ninguém vai passar.
 */
export function pointAtDistance(
  coordinates: readonly [number, number][],
  distanceKm: number,
): Coordinates | null {
  if (coordinates.length < 2 || distanceKm < 0) return null

  const first = coordinates[0]
  if (!first) return null
  if (distanceKm === 0) return { longitude: first[0], latitude: first[1] }

  let walked = 0
  for (let i = 1; i < coordinates.length; i += 1) {
    const previous = coordinates[i - 1]
    const current = coordinates[i]
    if (!previous || !current) break

    const from: Coordinates = { longitude: previous[0], latitude: previous[1] }
    const to: Coordinates = { longitude: current[0], latitude: current[1] }
    const segmentKm = haversineKm(from, to)

    if (walked + segmentKm >= distanceKm) {
      // Interpola dentro do trecho. Em segmentos curtos de uma rota real, a
      // interpolação linear em graus é indistinguível da geodésica.
      const ratio = segmentKm === 0 ? 0 : (distanceKm - walked) / segmentKm
      return {
        longitude: from.longitude + (to.longitude - from.longitude) * ratio,
        latitude: from.latitude + (to.latitude - from.latitude) * ratio,
      }
    }

    walked += segmentKm
  }

  return null
}
