/** Ponto geográfico em graus decimais, WGS 84. */
export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Posição GeoJSON: `[longitude, latitude]` e, quando o provedor mede o relevo,
 * a altitude em metros como terceiro valor.
 *
 * O terceiro valor é opcional no formato e é opcional aqui: traçados gravados
 * antes de o roteador passar a pedir altimetria continuam sendo pares, e o tipo
 * obriga quem lê a tratar essa ausência.
 */
export type RoutePosition = [number, number] | [number, number, number]

const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Distância em linha reta sobre a esfera, em quilômetros.
 *
 * É deliberadamente uma aproximação: não conhece estradas nem relevo. Quem
 * precisa de distância rodoviária aplica o fator de sinuosidade de
 * `discovery.ts` sobre este valor.
 */
export function haversineKm(from: Coordinates, to: Coordinates): number {
  const deltaLat = toRadians(to.latitude - from.latitude)
  const deltaLng = toRadians(to.longitude - from.longitude)
  const fromLat = toRadians(from.latitude)
  const toLat = toRadians(to.latitude)

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.sin(deltaLng / 2) ** 2 * Math.cos(fromLat) * Math.cos(toLat)

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** Retângulo geográfico em graus decimais. */
export interface BoundingBox {
  west: number
  south: number
  east: number
  north: number
}

/**
 * Menor retângulo que contém todos os pontos. `null` para uma lista vazia.
 *
 * Não trata a travessia do antimeridiano: o produto é de Santa Catarina e
 * inventar suporte a um caso que não existe custaria clareza sem comprar nada.
 */
export function boundingBox(
  points: readonly Coordinates[],
): BoundingBox | null {
  if (points.length === 0) return null

  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity

  for (const point of points) {
    if (point.longitude < west) west = point.longitude
    if (point.longitude > east) east = point.longitude
    if (point.latitude < south) south = point.latitude
    if (point.latitude > north) north = point.latitude
  }

  return { west, south, east, north }
}

/** Coordenada para leitura de instrumento: sinal explícito, quatro decimais. */
export function formatCoordinate(value: number): string {
  return value.toFixed(4)
}

/** Abaixo de 10 km a casa decimal informa; acima dela, só polui. */
export function formatDistanceKm(km: number): string {
  if (km < 10) {
    return km.toFixed(1).replace('.', ',')
  }
  return Math.round(km).toString()
}

/** `512` → `8h32`; `45` → `45min`; `120` → `2h00`. */
export function formatDurationMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  const hours = Math.floor(total / 60)
  const rest = total % 60

  if (hours === 0) {
    return `${rest}min`
  }
  return `${hours}h${rest.toString().padStart(2, '0')}`
}
