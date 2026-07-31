import { summarizeRouteDay, type RouteDay } from '@/domain/weather'
import type { TripDetail } from '@/domain/trip'
import { getWeatherClient, type WeatherPoint } from '@/lib/weather'
import { RouteWeatherPanel } from './RouteWeatherPanel'

const TIMEZONE = 'America/Sao_Paulo'

/**
 * A hora local em São Paulo, como `['2026-07-31', '2026-07-31T14:00']`.
 *
 * O servidor pode estar em qualquer fuso, e a previsão vem em horário de
 * Brasília. Sem esta conversão, "hoje" seria o dia do datacenter — e depois das
 * 21h de Brasília isso já é amanhã em UTC.
 */
function nowInBrazil(): { today: string; hour: string } {
  // `sv-SE` formata como `2026-07-31 14:23:05`, que é ISO com espaço no meio.
  const local = new Intl.DateTimeFormat('sv-SE', {
    timeZone: TIMEZONE,
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date())

  const [date = '', time = ''] = local.split(' ')
  return { today: date, hour: `${date}T${time.slice(0, 2)}:00` }
}

/**
 * Consulta a previsão para a rota inteira e monta os três dias.
 *
 * Componente de servidor: a chamada externa nunca sai do navegador, e as 72
 * horas de cada ponto viram três resumos antes de atravessar a rede — mandar as
 * séries cruas para o cliente seria uns 40 KB para desenhar quatro linhas.
 */
export async function RouteWeather({ trip }: { trip: TripDetail }) {
  const points: WeatherPoint[] = [
    ...(trip.originCoordinates
      ? [
          {
            label: trip.originLabel ?? 'Origem',
            coordinates: trip.originCoordinates,
          },
        ]
      : []),
    ...trip.stops.map((stop) => ({
      label: stop.label,
      coordinates: stop.coordinates,
    })),
  ]

  if (points.length === 0) return null

  const forecast = await getWeatherClient().forecast(points)
  if (!forecast) return null

  const { today, hour } = nowInBrazil()

  const days: RouteDay[] = []
  for (const date of forecast.dates) {
    // Só o dia de hoje corta as horas passadas; os outros começam às 7h.
    const day = summarizeRouteDay(
      forecast.stops,
      date,
      date === today ? hour : null,
    )
    if (day) days.push(day)
  }

  // Depois das 19h de hoje, "hoje" some sozinho e a tela abre em amanhã.
  if (days.length === 0) return null

  return <RouteWeatherPanel days={days} today={today} />
}
