/** Ponto geográfico em graus decimais, WGS 84. */
export interface Coordinates {
  latitude: number
  longitude: number
}

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
