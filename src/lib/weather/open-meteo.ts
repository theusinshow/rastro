import type { HourReading, StopWeather } from '@/domain/weather'
import type { RouteWeather, WeatherClient, WeatherPoint } from './weather-client'

const ENDPOINT = 'https://api.open-meteo.com/v1/forecast'

/** Três dias respondem "vale sair no fim de semana?" sem virar app de clima. */
const FORECAST_DAYS = 3

/**
 * Fuso fixo, e não `auto`.
 *
 * O produto é de Santa Catarina e o servidor pode estar em qualquer lugar. Com
 * `auto`, os horários voltariam no fuso do PONTO consultado — que aqui é o mesmo,
 * mas passaria a depender de infraestrutura para uma resposta que é do produto.
 */
const TIMEZONE = 'America/Sao_Paulo'

/** Previsão do tempo não muda de minuto a minuto, e a fonte é gratuita. */
const REVALIDATE_SECONDS = 1800

const TIMEOUT_MS = 6000

/**
 * As quatro variáveis que mudam a decisão de sair.
 *
 * `cloud_cover_low` ficou de fora depois de medida: Palhoça aparece com 100% de
 * nuvem baixa e 22 km de visibilidade na mesma hora. Nuvem sobre a cabeça não é
 * serra fechada.
 */
const HOURLY =
  'temperature_2m,precipitation_probability,visibility,wind_speed_10m'

interface OpenMeteoPoint {
  hourly?: {
    time?: unknown
    temperature_2m?: unknown
    precipitation_probability?: unknown
    visibility?: unknown
    wind_speed_10m?: unknown
  }
}

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'number')
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

/**
 * Traduz UM ponto. `null` a qualquer sinal de que o corpo não é o esperado.
 *
 * Alinha as cinco séries por índice, e para na primeira que for mais curta:
 * uma hora com temperatura e sem visibilidade seria uma leitura pela metade
 * apresentada como leitura inteira.
 */
function toStopWeather(label: string, point: unknown): StopWeather | null {
  const hourly = (point as OpenMeteoPoint)?.hourly
  const { time, temperature_2m, precipitation_probability, visibility } =
    hourly ?? {}
  const wind = hourly?.wind_speed_10m

  if (!isStringArray(time)) return null
  if (!isNumberArray(temperature_2m)) return null
  if (!isNumberArray(precipitation_probability)) return null
  if (!isNumberArray(visibility)) return null
  if (!isNumberArray(wind)) return null

  const total = Math.min(
    time.length,
    temperature_2m.length,
    precipitation_probability.length,
    visibility.length,
    wind.length,
  )

  const readings: HourReading[] = []
  for (let i = 0; i < total; i++) {
    const hour = time[i]
    const temperatureC = temperature_2m[i]
    const rainChance = precipitation_probability[i]
    const visibilityM = visibility[i]
    const windKph = wind[i]
    if (
      hour === undefined ||
      temperatureC === undefined ||
      rainChance === undefined ||
      visibilityM === undefined ||
      windKph === undefined
    ) {
      continue
    }
    readings.push({ hour, temperatureC, rainChance, visibilityM, windKph })
  }

  return readings.length > 0 ? { label, readings } : null
}

export function createOpenMeteoClient(): WeatherClient {
  return {
    async forecast(points) {
      if (points.length === 0) return null

      const url = new URL(ENDPOINT)
      url.searchParams.set(
        'latitude',
        points.map((point) => point.coordinates.latitude).join(','),
      )
      url.searchParams.set(
        'longitude',
        points.map((point) => point.coordinates.longitude).join(','),
      )
      url.searchParams.set('hourly', HOURLY)
      url.searchParams.set('timezone', TIMEZONE)
      url.searchParams.set('forecast_days', String(FORECAST_DAYS))

      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
          next: { revalidate: REVALIDATE_SECONDS },
        })
        if (!response.ok) return null

        const body: unknown = await response.json()

        // Um ponto devolve OBJETO; vários devolvem ARRAY. Medido contra a API
        // real, e é a armadilha desta fonte: tratar sempre como array daria
        // `undefined` silencioso na viagem de uma parada só.
        const lista = Array.isArray(body) ? body : [body]

        const stops: StopWeather[] = []
        for (let i = 0; i < points.length; i++) {
          const point = points[i]
          if (!point) continue
          const stop = toStopWeather(point.label, lista[i])
          // Um ponto sem previsão não derruba os outros: a serra continua
          // respondida mesmo se a praia falhar.
          if (stop) stops.push(stop)
        }
        if (stops.length === 0) return null

        const dates = [
          ...new Set(
            stops.flatMap((stop) =>
              stop.readings.map((reading) => reading.hour.slice(0, 10)),
            ),
          ),
        ].sort()

        return { dates, stops } satisfies RouteWeather
      } catch {
        // Rede, timeout, JSON inválido: tudo vira `null`, e a página perde um
        // aviso em vez de perder a viagem.
        return null
      }
    },
  }
}

export type { WeatherPoint }
