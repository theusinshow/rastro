import { describe, expect, it } from 'vitest'
import { toTripDetailFromRow, toTripSummaryFromRow } from './trip-row'
import type { TripRow, TripStopRow } from './trip-row'

function stopRow(overrides: Partial<TripStopRow> = {}): TripStopRow {
  return {
    id: 's1',
    place_id: null,
    order_index: 0,
    label: 'Parada',
    latitude: -28,
    longitude: -49,
    kind: 'waypoint',
    arrived_at: null,
    ...overrides,
  }
}

function row(overrides: Partial<TripRow> = {}): TripRow {
  return {
    id: 't1',
    slug: 'serra-do-rio-do-rastro',
    title: 'Serra do Rio do Rastro',
    status: 'planned',
    started_at: null,
    ended_at: null,
    origin_label: 'Palhoça, SC',
    origin_latitude: -27.6455,
    origin_longitude: -48.67,
    distance_km: 184.5,
    duration_minutes: 220,
    notes: null,
    route_geojson: null,
    trip_stops: [],
    ...overrides,
  }
}

describe('toTripSummaryFromRow', () => {
  it('sem traçado gravado, marca os números como estimados', () => {
    expect(toTripSummaryFromRow(row()).hasRealRoute).toBe(false)
  })

  it('com traçado gravado, marca os números como medidos', () => {
    const summary = toTripSummaryFromRow(
      row({
        route_geojson: {
          type: 'LineString',
          coordinates: [
            [-48.67, -27.64],
            [-49.4, -28.1],
          ],
        },
      }),
    )

    expect(summary.hasRealRoute).toBe(true)
  })

  it('conta as paradas', () => {
    const summary = toTripSummaryFromRow(
      row({
        trip_stops: [
          stopRow({ id: 's1', order_index: 0 }),
          stopRow({ id: 's2', order_index: 1 }),
        ],
      }),
    )

    expect(summary.stopCount).toBe(2)
  })

  it('numérico do Postgres chega como string e vira número', () => {
    // `numeric(8,2)` volta do PostgREST como string, para não perder precisão.
    // Sem coerção, a interface formataria "184.50" e somas concatenariam.
    const summary = toTripSummaryFromRow(
      row({ distance_km: '184.50' as unknown as number }),
    )

    expect(summary.distanceKm).toBe(184.5)
  })
})

describe('toTripDetailFromRow', () => {
  it('ordena as paradas por order_index, não pela ordem que o banco devolveu', () => {
    const detail = toTripDetailFromRow(
      row({
        trip_stops: [
          stopRow({ id: 'terceira', order_index: 2, label: 'C' }),
          stopRow({ id: 'primeira', order_index: 0, label: 'A' }),
          stopRow({ id: 'segunda', order_index: 1, label: 'B' }),
        ],
      }),
    )

    expect(detail.stops.map((stop) => stop.label)).toEqual(['A', 'B', 'C'])
  })

  it('sem coordenada de origem, devolve null em vez de zero-zero', () => {
    // Zero-zero é um ponto no golfo da Guiné. Fingir coordenada faria o mapa
    // enquadrar o Atlântico e a distância mentir.
    const detail = toTripDetailFromRow(
      row({ origin_latitude: null, origin_longitude: null }),
    )

    expect(detail.originCoordinates).toBeNull()
  })
})
