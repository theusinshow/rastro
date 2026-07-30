import type { Coordinates } from '@/domain/geo'
import type { TripDetail, TripStopKind, TripSummary } from '@/domain/trip'

export interface NewTripStopInput {
  placeId: string | null
  label: string
  coordinates: Coordinates
  kind: TripStopKind
}

export interface NewTripInput {
  title: string
  originLabel: string | null
  originCoordinates: Coordinates
  /** Já na ordem de rodagem: o índice no array é a posição na viagem. */
  stops: NewTripStopInput[]
  /** Medidos quando houver traçado; estimados quando não. */
  distanceKm: number
  durationMinutes: number
  /** `null` quando o roteamento falhou — e é o sinal de "número estimado". */
  routeGeoJson: {
    type: 'LineString'
    coordinates: [number, number][]
  } | null
}

/**
 * Contrato de viagens.
 *
 * Nenhum método recebe `userId` para filtrar: a política `trips_own` filtra por
 * `auth.uid()`, e `trip_stops_via_trip` herda a posse da viagem. Ver ADR 0008.
 */
export interface TripRepository {
  listTrips(): Promise<TripSummary[]>
  getBySlug(slug: string): Promise<TripDetail | null>
  listSlugs(): Promise<string[]>
  createTrip(input: NewTripInput, slug: string): Promise<TripDetail>
  deleteTrip(id: string): Promise<void>
  /**
   * Conclui a viagem e registra visita nas paradas confirmadas, numa transação.
   *
   * `visitedAt` é data civil `YYYY-MM-DD`, no fuso de quem viajou.
   */
  completeTrip(
    tripId: string,
    confirmedStopIds: readonly string[],
    visitedAt: string,
  ): Promise<void>
}
