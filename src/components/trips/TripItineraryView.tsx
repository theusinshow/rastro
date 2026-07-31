import { Suspense } from 'react'
import Link from 'next/link'
import { formatVisitDate } from '@/domain/dates'
import { buildElevationProfile } from '@/domain/elevation'
import { formatDistanceKm, formatDurationMinutes } from '@/domain/geo'
import { googleMapsRouteUrl } from '@/domain/google-maps-link'
import { TRIP_STATUS_LABELS, unpavedStops, type TripDetail } from '@/domain/trip'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { ElevationProfileView } from './ElevationProfile'
import { RouteWeather } from './RouteWeather'
import { TripDeleteAction } from './TripDeleteAction'

interface TripItineraryViewProps {
  trip: TripDetail
}

const ACTION =
  'press inline-flex h-12 items-center justify-center rounded-md px-5 ' +
  'text-body font-medium tracking-[0.02em]'

export function TripItineraryView({ trip }: TripItineraryViewProps) {
  // `null` para viagem sem traçado, e também para as gravadas antes de o
  // roteador pedir altimetria: nesses casos a seção simplesmente não existe.
  const elevation = trip.routeGeoJson
    ? buildElevationProfile(trip.routeGeoJson.coordinates)
    : null

  const unpaved = unpavedStops(trip.stops)

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

      {/* Previsão só faz sentido para viagem que ainda vai acontecer. Numa
          viagem concluída ela seria o clima de outro dia que não o vivido. */}
      {trip.status !== 'completed' ? (
        // Sem esqueleto: o bloco aparece quando a previsão chega, e o resto da
        // página não espera por ela.
        <Suspense fallback={null}>
          <RouteWeather trip={trip} />
        </Suspense>
      ) : null}

      {elevation ? <ElevationProfileView profile={elevation} /> : null}

      {/* Antes da lista, não depois: quem lê isso pode decidir não ir, e a
          decisão vem antes de conferir a ordem das paradas. */}
      {unpaved.length > 0 ? (
        <div className="px-5 pt-4">
          <InlineMessage tone="info">
            Tem chão no caminho: {unpaved.map((stop) => stop.label).join(', ')}.
          </InlineMessage>
        </div>
      ) : null}

      <ul className={elevation ? '' : 'mt-2'}>
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
