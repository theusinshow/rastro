'use client'

import { formatVisitDate } from '@/domain/dates'
import {
  AVERAGE_SPEED_KMH,
  ROAD_SINUOSITY_FACTOR,
} from '@/domain/discovery'
import {
  formatDistanceKm,
  formatDurationMinutes,
  haversineKm,
} from '@/domain/geo'
import { CATEGORY_LABELS, type ExplorePlace } from '@/domain/place'
import { DEFAULT_ORIGIN, DEFAULT_ORIGIN_LABEL } from '@/mocks/user'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { Stat } from '@/components/ui/Stat'
import { PlaceActions } from './PlaceActions'
import { VisitStatusBadge } from './VisitStatusBadge'

interface PlacePanelProps {
  place: ExplorePlace
  onClose: () => void
}

export function PlacePanel({ place, onClose }: PlacePanelProps) {
  const straightLineKm = haversineKm(DEFAULT_ORIGIN, place)
  const roadKm = straightLineKm * ROAD_SINUOSITY_FACTOR
  const minutes = (roadKm / AVERAGE_SPEED_KMH) * 60

  return (
    <OverlayPanel side="right">
      <header className="flex items-start gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <span className="instrument-label">
            {CATEGORY_LABELS[place.category]}
          </span>
          <h1 className="mt-1 text-lg leading-tight font-medium text-ink">
            {place.name}
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            {place.municipality} · {place.stateCode}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel"
          className="shrink-0 px-1 text-lg leading-none text-ink-faint
                     transition-colors hover:text-ink"
        >
          ×
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Faixa de fotografia. Sem foto, o espaço é assumido em vez de
            desaparecer: fotografia é conteúdo central deste produto. */}
        <div className="flex h-40 items-center justify-center border-b border-line bg-raised">
          {place.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={place.coverImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="instrument-label">
              {place.photoCount > 0
                ? `${place.photoCount} fotografias`
                : 'Sem fotografias'}
            </span>
          )}
        </div>

        <div className="flex gap-8 border-b border-line px-5 py-4">
          <Stat
            label="Distância"
            value={formatDistanceKm(roadKm)}
            unit="km"
          />
          <Stat label="Tempo" value={formatDurationMinutes(minutes)} />
        </div>

        <div className="flex items-center gap-4 border-b border-line px-5 py-3">
          <VisitStatusBadge status={place.visitStatus} />
          {place.lastVisitedAt ? (
            <span className="instrument-value text-[10px] text-ink-faint">
              {formatVisitDate(place.lastVisitedAt)}
            </span>
          ) : null}
        </div>

        {place.description ? (
          <p className="px-5 py-4 text-sm leading-relaxed text-ink-muted">
            {place.description}
          </p>
        ) : null}

        {place.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 px-5 pb-4">
            {place.tags.map((tag) => (
              <li
                key={tag}
                className="border border-line px-1.5 py-0.5 text-[10px]
                           tracking-[0.08em] text-ink-faint"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="px-5 pb-4 text-[10px] leading-relaxed text-ink-faint">
          Distância e tempo são estimativas em linha reta a partir de{' '}
          {DEFAULT_ORIGIN_LABEL}, corrigidas por um fator de estrada. Não
          substituem um roteador.
        </p>
      </div>

      <PlaceActions place={place} />
    </OverlayPanel>
  )
}
