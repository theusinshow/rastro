'use client'

import type { DiscoveryResult } from '@/domain/discovery'
import { formatDistanceKm, formatDurationMinutes } from '@/domain/geo'
import { CATEGORY_LABELS } from '@/domain/place'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { VisitStatusBadge } from './VisitStatusBadge'

interface DiscoveryResultsProps {
  results: DiscoveryResult[]
  onSelect: (slug: string) => void
}

export function DiscoveryResults({ results, onSelect }: DiscoveryResultsProps) {
  return (
    <OverlayPanel side="right" width={340}>
      <header className="border-b border-line px-5 py-4">
        <span className="instrument-label">Destinos possíveis</span>
        <p className="instrument-value mt-1 text-lg text-ink">
          {results.length}
        </p>
      </header>

      {results.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center gap-2 px-5">
          <p className="text-sm leading-relaxed text-ink-muted">
            Nenhum destino cabe nesses limites.
          </p>
          <p className="text-xs leading-relaxed text-ink-faint">
            Aumente a distância, o tempo disponível, ou remova alguma categoria.
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {results.map((result) => (
            <li key={result.place.slug}>
              <button
                type="button"
                onClick={() => onSelect(result.place.slug)}
                className="w-full border-b border-line px-5 py-3.5 text-left
                           transition-colors hover:bg-overlay"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-ink">{result.place.name}</span>
                  <span className="instrument-value shrink-0 text-xs text-accent">
                    {formatDistanceKm(result.estimatedRoadKm)} km
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.1em] text-ink-faint uppercase">
                    {CATEGORY_LABELS[result.place.category]}
                  </span>
                  <span className="instrument-value text-[10px] text-ink-faint">
                    {formatDurationMinutes(result.estimatedRoundTripMinutes)} ida
                    e volta
                  </span>
                </div>
                <div className="mt-1.5">
                  <VisitStatusBadge status={result.place.visitStatus} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="border-t border-line px-5 py-3 text-[10px] leading-relaxed text-ink-faint">
        Estimativas em linha reta com fator de estrada, a 55 km/h médios,
        reservando um quarto do tempo para paradas. Não substituem um roteador.
      </p>
    </OverlayPanel>
  )
}
