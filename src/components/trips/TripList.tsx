import Link from 'next/link'
import { formatVisitDate } from '@/domain/dates'
import { formatDistanceKm, formatDurationMinutes } from '@/domain/geo'
import { TRIP_STATUS_LABELS, type TripSummary } from '@/domain/trip'

interface TripListProps {
  trips: TripSummary[]
}

/** Mesmo peso do `Button` variante `solid`, tamanho `md`, num elemento de link. */
const CTA =
  'press inline-flex h-12 items-center justify-center rounded-md bg-accent ' +
  'px-5 text-body font-medium tracking-[0.02em] text-on-accent ' +
  'hover:bg-accent-strong'

export function TripList({ trips }: TripListProps) {
  if (trips.length === 0) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-3 px-5">
        <span className="instrument-label">Viagens</span>
        <p className="text-body leading-relaxed text-ink-muted">
          Nenhuma viagem ainda. Monte um roteiro e ele aparece aqui.
        </p>
        <Link href="/viagens/nova" className={`${CTA} mt-2`}>
          Montar um roteiro
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <span className="instrument-label">Viagens</span>
        <span className="instrument-value text-small text-ink-faint">
          {trips.length}
        </span>
      </div>

      <ul className="flex-1 overflow-y-auto">
        {trips.map((trip) => (
          <li key={trip.id} className="border-b border-line last:border-b-0">
            <Link
              href={`/viagens/${trip.slug}`}
              className="flex flex-col gap-1 px-5 py-4 hover:bg-overlay"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-body text-ink">{trip.title}</span>
                {trip.distanceKm !== null ? (
                  <span className="instrument-value text-small whitespace-nowrap text-ink-faint">
                    {formatDistanceKm(trip.distanceKm)} km
                  </span>
                ) : null}
              </span>

              <span className="instrument-label flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>{TRIP_STATUS_LABELS[trip.status]}</span>
                {trip.endedAt ? (
                  <span>{formatVisitDate(trip.endedAt.slice(0, 10))}</span>
                ) : null}
                {trip.durationMinutes !== null ? (
                  <span className="instrument-value">
                    {formatDurationMinutes(trip.durationMinutes)}
                  </span>
                ) : null}
                {/* Sem traçado gravado, o número veio de estimativa. Dizer isso é
                    a mesma regra que impede apresentar dado de mocks como real. */}
                {!trip.hasRealRoute ? <span>estimado</span> : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="border-t border-line px-5 py-4">
        <Link href="/viagens/nova" className={`${CTA} w-full`}>
          Montar um roteiro
        </Link>
      </div>
    </>
  )
}
