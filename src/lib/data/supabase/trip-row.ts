import type { RoutePosition } from '@/domain/geo'
import type {
  TripDetail,
  TripDetailStop,
  TripStatus,
  TripStopKind,
  TripSummary,
} from '@/domain/trip'

/**
 * Uma projeção só. A lista e o detalhe leem as mesmas colunas: o embed de paradas
 * é barato num produto pessoal, e duas projeções divergiriam em silêncio.
 */
export const TRIP_SELECT = `
  id, slug, title, status, started_at, ended_at,
  origin_label, origin_latitude, origin_longitude,
  distance_km, duration_minutes, notes, route_geojson,
  trip_stops (id, place_id, order_index, label, latitude, longitude, kind, arrived_at)
`

export interface TripStopRow {
  id: string
  place_id: string | null
  order_index: number
  label: string
  latitude: number | null
  longitude: number | null
  kind: TripStopKind
  arrived_at: string | null
}

export interface TripRow {
  id: string
  slug: string
  title: string
  status: TripStatus
  started_at: string | null
  ended_at: string | null
  origin_label: string | null
  origin_latitude: number | null
  origin_longitude: number | null
  distance_km: number | null
  duration_minutes: number | null
  notes: string | null
  route_geojson: {
    type: 'LineString'
    coordinates: RoutePosition[]
  } | null
  trip_stops: TripStopRow[]
}

/**
 * `numeric` do Postgres chega do PostgREST como string, para não perder precisão.
 * Sem esta coerção a interface formataria "184.50" e qualquer soma viraria
 * concatenação.
 */
function toNumber(value: number | null): number | null {
  if (value === null) return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function toTripSummaryFromRow(row: TripRow): TripSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    status: row.status,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    distanceKm: toNumber(row.distance_km),
    durationMinutes: toNumber(row.duration_minutes),
    stopCount: row.trip_stops.length,
    hasRealRoute: row.route_geojson !== null,
  }
}

function toDetailStop(row: TripStopRow): TripDetailStop {
  return {
    id: row.id,
    placeId: row.place_id,
    orderIndex: row.order_index,
    label: row.label,
    coordinates: {
      latitude: row.latitude ?? 0,
      longitude: row.longitude ?? 0,
    },
    kind: row.kind,
    arrivedAt: row.arrived_at,
  }
}

export function toTripDetailFromRow(row: TripRow): TripDetail {
  return {
    ...toTripSummaryFromRow(row),
    originLabel: row.origin_label,
    // `null` explícito, e nunca zero-zero: zero-zero é um ponto no golfo da
    // Guiné, e fingir coordenada faria o mapa enquadrar o Atlântico.
    originCoordinates:
      row.origin_latitude !== null && row.origin_longitude !== null
        ? { latitude: row.origin_latitude, longitude: row.origin_longitude }
        : null,
    notes: row.notes,
    // A ordem vem do `order_index`, não da ordem em que o banco devolveu: um
    // embed do PostgREST não garante ordenação, e uma volta fora de ordem
    // desenharia um traçado que cruza consigo mesmo.
    stops: [...row.trip_stops]
      .sort((a, b) => a.order_index - b.order_index)
      .map(toDetailStop),
    routeGeoJson: row.route_geojson,
  }
}
