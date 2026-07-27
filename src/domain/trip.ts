import type { Coordinates } from './geo'

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
