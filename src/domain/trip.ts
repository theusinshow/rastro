import type { Coordinates, RoutePosition } from './geo'

export type TripStatus = 'planned' | 'ongoing' | 'completed'

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  planned: 'Planejada',
  ongoing: 'Em andamento',
  completed: 'Concluída',
}

export type TripStopKind =
  | 'start'
  | 'waypoint'
  | 'destination'
  | 'fuel'
  | 'meal'

export interface TripStop {
  id: string
  tripId: string
  placeId: string | null
  orderIndex: number
  label: string
  coordinates: Coordinates
  kind: TripStopKind
  arrivedAt: string | null
  notes: string | null
}

export interface TripPhoto {
  id: string
  tripId: string
  userId: string
  placeId: string | null
  storagePath: string
  width: number | null
  height: number | null
  /** Preenchido a partir de EXIF quando disponível. Não lemos EXIF ainda. */
  coordinates: Coordinates | null
  takenAt: string | null
  caption: string | null
  sortIndex: number
}

export interface Trip {
  id: string
  userId: string
  motorcycleId: string | null
  title: string
  slug: string
  status: TripStatus
  startedAt: string | null
  endedAt: string | null
  originLabel: string | null
  originCoordinates: Coordinates | null
  primaryPlaceId: string | null
  distanceKm: number | null
  durationMinutes: number | null
  /** Avaliação da viagem como um todo, distinta da nota do lugar. */
  rating: number | null
  notes: string | null
}

/** Uma parada já persistida, com o lugar do catálogo quando houver. */
export interface TripDetailStop {
  id: string
  placeId: string | null
  orderIndex: number
  label: string
  coordinates: Coordinates
  kind: TripStopKind
  /** Preenchido ao concluir a viagem, para as paradas confirmadas. */
  arrivedAt: string | null
}

/** O que a lista de viagens precisa. Sem paradas: a lista não as mostra. */
export interface TripSummary {
  id: string
  slug: string
  title: string
  status: TripStatus
  startedAt: string | null
  endedAt: string | null
  distanceKm: number | null
  durationMinutes: number | null
  stopCount: number
  /**
   * `false` quando `route_geojson` é nulo: os números vieram do fator de
   * sinuosidade, não de malha viária. A interface é obrigada a dizer isso — é o
   * mesmo princípio que impede apresentar dado de `src/mocks/` como verificado.
   */
  hasRealRoute: boolean
}

export interface TripDetail extends TripSummary {
  originLabel: string | null
  originCoordinates: Coordinates | null
  notes: string | null
  stops: TripDetailStop[]
  /** `LineString` do traçado real, quando houver. */
  routeGeoJson: {
    type: 'LineString'
    coordinates: RoutePosition[]
  } | null
}
