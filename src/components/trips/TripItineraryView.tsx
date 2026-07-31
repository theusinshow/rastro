import Link from 'next/link'
import { formatVisitDate } from '@/domain/dates'
import { formatDistanceKm, formatDurationMinutes } from '@/domain/geo'
import { googleMapsRouteUrl } from '@/domain/google-maps-link'
import { TRIP_STATUS_LABELS, type TripDetail } from '@/domain/trip'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { TripDeleteAction } from './TripDeleteAction'

interface TripItineraryViewProps {
  trip: TripDetail
}

const ACTION =
  'press inline-flex h-12 items-center justify-center rounded-md px-5 ' +
  'text-body font-medium tracking-[0.02em]'

export function TripItineraryView({ trip }: TripItineraryViewProps) {
  const googleUrl = trip.originCoordinates
    ? googleMapsRouteUrl(
        trip.originCoordinates,
        trip.stops.map((stop) => stop.coordinates),
      )
    : null

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex flex-col gap-2 border-b border-line px-5 py-4">
        <span className="instrument-label">
          {TRIP_STATUS_LABELS[trip.status]}
          {trip.endedAt ? ` · ${formatVisitDate(trip.endedAt.slice(0, 10))}` : ''}
        </span>
        <h2 className="type-title text-title text-ink">{trip.title}</h2>

        <div className="mt-1 flex items-baseline gap-4">
          {trip.distanceKm !== null ? (
            <span className="instrument-value text-body text-ink">
              {formatDistanceKm(trip.distanceKm)} km
            </span>
          ) : null}
          {trip.durationMinutes !== null ? (
            <span className="instrument-value text-body text-ink-muted">
              {formatDurationMinutes(trip.durationMinutes)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Sem traçado gravado, os números vieram do fator de sinuosidade, não de
          malha viária. Apresentar estimativa como medição seria a mesma coisa que
          apresentar dado de `src/mocks/` como verificado. */}
      {!trip.hasRealRoute ? (
        <div className="px-5 pt-4">
          <InlineMessage tone="info">
            Distância e tempo são estimados a partir da linha reta, não medidos na
            estrada.
          </InlineMessage>
        </div>
      ) : null}

      <ul className="mt-2">
        {trip.stops.map((stop, index) => (
          <li
            key={stop.id}
            className="flex items-baseline gap-4 border-b border-line px-5 py-3"
          >
            <span className="instrument-value w-5 shrink-0 text-small text-ink-faint">
              {index + 1}
            </span>
            <span className="flex-1 text-body text-ink">{stop.label}</span>
            {stop.arrivedAt ? (
              <span className="instrument-label text-visited">visitado</span>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-3 border-t border-line px-5 py-4">
        {googleUrl ? (
          <a
            href={googleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`${ACTION} border border-line-strong text-ink hover:border-accent hover:bg-overlay`}
          >
            Abrir no Google Maps
          </a>
        ) : null}

        {trip.status === 'planned' ? (
          <Link
            href={`/viagens/${trip.slug}/concluir`}
            className={`${ACTION} bg-accent text-on-accent hover:bg-accent-strong`}
          >
            Concluir viagem
          </Link>
        ) : null}

        <Link
          href="/viagens"
          className={`${ACTION} text-ink-muted hover:bg-overlay hover:text-ink`}
        >
          Voltar às viagens
        </Link>

        <div className="mt-1 border-t border-line pt-4">
          <TripDeleteAction trip={trip} />
        </div>
      </div>
    </div>
  )
}
