import type { Coordinates } from '@/domain/geo'
import type { StopWeather } from '@/domain/weather'

export interface WeatherPoint {
  label: string
  coordinates: Coordinates
}

export interface RouteWeather {
  /** Datas civis cobertas, em ordem. `['2026-07-31', …]`. */
  dates: string[]
  /** Na MESMA ordem dos pontos pedidos. */
  stops: StopWeather[]
}

/**
 * Uma função, um retorno, e `null` como ÚNICA forma de falha — o mesmo contrato
 * do `RoutingClient`, pela mesma razão: o modo degradado tem de ser um `if` no
 * chamador, e não um segundo caminho de código.
 *
 * A implementação NUNCA lança. Sem previsão, a viagem continua inteira; o que se
 * perde é um aviso, não a página.
 */
export interface WeatherClient {
  forecast(points: readonly WeatherPoint[]): Promise<RouteWeather | null>
}
