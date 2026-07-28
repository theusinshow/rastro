'use client'

import { formatVisitDate } from '@/domain/dates'
import { estimateRidingMinutes, estimateRoadKm } from '@/domain/discovery'
import {
  formatDistanceKm,
  formatDurationMinutes,
  haversineKm,
} from '@/domain/geo'
import { CATEGORY_LABELS, type ExplorePlace } from '@/domain/place'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { useOrigin } from '@/components/layout/origin-context'
import { CloseButton } from '@/components/ui/CloseButton'
import { Stat } from '@/components/ui/Stat'
import { PlaceActions } from './PlaceActions'
import { PlaceStateControls } from './PlaceStateControls'
import { PlaceVisits } from './PlaceVisits'
import { VisitStatusBadge } from './VisitStatusBadge'

interface PlacePanelProps {
  place: ExplorePlace
  onClose: () => void
  exiting?: boolean
}

export function PlacePanel({ place, onClose, exiting }: PlacePanelProps) {
  const { origin, label: originLabel } = useOrigin()
  // Sem origem não há distância nem tempo a mostrar. O resto do painel — nome,
  // categoria, descrição, situação — não depende de onde você mora.
  const roadKm = origin ? estimateRoadKm(haversineKm(origin, place)) : null
  const minutes = roadKm === null ? null : estimateRidingMinutes(roadKm)

  return (
    <OverlayPanel side="right" exiting={exiting}>
      <header className="flex shrink-0 items-start gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <span className="instrument-label">
            {CATEGORY_LABELS[place.category]}
          </span>
          {/* `h2`: o `h1` da rota é o título da tela, e o nome de um lugar é
              conteúdo dentro dela — não a identidade do documento. */}
          <h2 className="mt-1 text-title font-medium text-ink">
            {place.name}
          </h2>
          <p className="mt-1 text-small text-ink-muted">
            {place.municipality} · {place.stateCode}
          </p>
        </div>

        <CloseButton
          onClick={onClose}
          label={`Fechar o painel de ${place.name}`}
          className="-mt-1 -mr-2"
        />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Os 160px de faixa ficam reservados para quando existe imagem. Sem
            foto, o elemento mais alto do painel comunicava ausência e empurrava
            para baixo o nome, a distância e o status do lugar. */}
        {place.coverImageUrl ? (
          <div className="h-40 border-b border-line bg-raised">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={place.coverImageUrl}
              alt={`${place.name}, em ${place.municipality}`}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="border-b border-line px-5 py-3">
            <span className="instrument-label">
              {place.photoCount > 0
                ? `${place.photoCount} fotografias`
                : 'Sem fotografias'}
            </span>
          </div>
        )}

        {roadKm !== null && minutes !== null ? (
          <div className="flex gap-8 border-b border-line px-5 py-4">
            <Stat label="Distância" value={formatDistanceKm(roadKm)} unit="km" />
            <Stat label="Tempo" value={formatDurationMinutes(minutes)} />
          </div>
        ) : null}

        <div className="flex items-center gap-4 border-b border-line px-5 py-3">
          <VisitStatusBadge status={place.visitStatus} />
          {place.lastVisitedAt ? (
            <span className="instrument-value text-micro text-ink-faint">
              {formatVisitDate(place.lastVisitedAt)}
            </span>
          ) : null}
        </div>

        <PlaceStateControls place={place} />
        <PlaceVisits place={place} />

        {place.description ? (
          <p className="px-5 py-4 text-body leading-relaxed text-ink-muted">
            {place.description}
          </p>
        ) : null}

        {place.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 px-5 pb-4">
            {place.tags.map((tag) => (
              <li
                key={tag}
                className="border border-line px-1.5 py-0.5 text-micro
                           tracking-[0.08em] text-ink-faint"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        {originLabel ? (
          <p className="px-5 pb-4 text-micro leading-relaxed text-ink-faint">
            Distância e tempo são estimativas em linha reta a partir de{' '}
            {originLabel}, corrigidas por um fator de estrada. Não substituem um
            roteador.
          </p>
        ) : null}
      </div>

      <PlaceActions place={place} />
    </OverlayPanel>
  )
}
