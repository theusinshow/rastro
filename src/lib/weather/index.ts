import { createOpenMeteoClient } from './open-meteo'
import type { WeatherClient } from './weather-client'

/**
 * Sem chave e sem `if`: esta fonte não pede cadastro.
 *
 * A função existe assim mesmo, espelhando `getRoutingClient()`, para que trocar
 * de provedor um dia continue sendo uma linha — e para que o resto do código
 * nunca importe a implementação direto. Ver ADR 0015.
 */
export function getWeatherClient(): WeatherClient {
  return createOpenMeteoClient()
}

export type {
  RouteWeather,
  WeatherClient,
  WeatherPoint,
} from './weather-client'
