'use client'

import { estimateRoadKm } from '@/domain/discovery'
import {
  FILTER_CRITERION_LABELS,
  type ExploreFilters,
  type FilterRelaxation,
} from '@/domain/filters'
import { formatDistanceKm, haversineKm } from '@/domain/geo'
import { CATEGORY_LABELS, type ExplorePlace } from '@/domain/place'
import { useOrigin } from '@/components/layout/origin-context'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'
import { VisitStatusBadge } from './VisitStatusBadge'

function plural(count: number): string {
  return count === 1 ? 'lugar' : 'lugares'
}

interface PlaceListProps {
  /** O recorte visível, na ordem em que o domínio o devolveu. */
  places: ExplorePlace[]
  totalCount: number
  selectedSlug: string | null
  onSelect: (slug: string) => void
  onHover: (slug: string | null) => void
  /** Critério que mais elimina lugares, quando o recorte esvazia. */
  relaxation: FilterRelaxation | null
  onRelax: (filters: ExploreFilters) => void
  onReset: () => void
  className?: string
}

/**
 * Lista textual dos lugares no recorte.
 *
 * Não é redundância com o mapa. Os pins são camadas WebGL sobre um `<canvas>`:
 * não existe nó de DOM por lugar, e sem esta lista o produto não tem nenhum
 * caminho de teclado para a sua ação primária. Ela também é o que torna legível
 * "o que está no recorte" quando os pins se sobrepõem em zoom baixo, e o que dá
 * à rota `/` o estado vazio que faltava.
 */
export function PlaceList({
  places,
  totalCount,
  selectedSlug,
  onSelect,
  onHover,
  relaxation,
  onRelax,
  onReset,
  className,
}: PlaceListProps) {
  // Sem origem a coluna de distância some. Um número medido a partir de lugar
  // nenhum é pior que número nenhum.
  const { origin } = useOrigin()
  const criterionLabel = relaxation
    ? FILTER_CRITERION_LABELS[relaxation.criterion]
    : null

  return (
    <section className={cn('flex flex-col', className)} aria-label="Lugares no recorte">
      <header className="flex shrink-0 items-baseline justify-between gap-2 border-b border-line px-4 py-2.5">
        <span className="instrument-label">Lugares</span>
        <span
          // `key` reinicia o realce a cada valor novo — ver `.value-changed`.
          key={places.length}
          className="value-changed instrument-value px-1 text-[0.75rem] text-ink-faint"
        >
          {places.length} / {totalCount}
        </span>
      </header>

      {/* Os pins são invisíveis à árvore de acessibilidade, então esta contagem
          é a única representação acessível do resultado de um filtro. */}
      <span role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {places.length} {plural(places.length)} de {totalCount} no recorte
      </span>

      {places.length === 0 ? (
        <div className="empty-state flex flex-1 flex-col items-start gap-3 px-4 py-5">
          <p className="text-[1rem] leading-relaxed text-ink-muted">
            Nenhum lugar cabe nesse recorte.
          </p>
          {relaxation && criterionLabel ? (
            <>
              <p className="text-[0.9375rem] leading-relaxed text-ink-faint">
                O filtro de {criterionLabel} é o que mais elimina: sem ele voltam{' '}
                {relaxation.recovered} {plural(relaxation.recovered)}.
              </p>
              <Button
                size="sm"
                className="h-auto w-full py-1.5"
                onClick={() => onRelax(relaxation.filters)}
              >
                Remover {criterionLabel} — {relaxation.recovered}{' '}
                {plural(relaxation.recovered)}
              </Button>
            </>
          ) : (
            <>
              <p className="text-[0.9375rem] leading-relaxed text-ink-faint">
                Nenhum filtro isolado explica o vazio: são as restrições juntas.
              </p>
              <Button size="sm" className="h-auto w-full py-1.5" onClick={onReset}>
                Limpar todos os filtros
              </Button>
            </>
          )}
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {places.map((place) => {
            const selected = place.slug === selectedSlug
            return (
              <li key={place.slug}>
                <button
                  type="button"
                  onClick={() => onSelect(place.slug)}
                  onMouseEnter={() => onHover(place.slug)}
                  onMouseLeave={() => onHover(null)}
                  // Foco também realça o pin: quem navega por teclado precisa
                  // do mesmo vínculo entre linha e mapa que o mouse dá.
                  onFocus={() => onHover(place.slug)}
                  onBlur={() => onHover(null)}
                  aria-current={selected ? true : undefined}
                  className={cn(
                    'w-full border-b border-line px-4 py-2.5 text-left',
                    'transition-colors',
                    selected ? 'bg-overlay' : 'hover:bg-overlay',
                  )}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[0.9375rem] text-ink">{place.name}</span>
                    {/* Distância corrigida por estrada, a mesma do painel e da
                        descoberta: a linha e o painel ficam visíveis ao mesmo
                        tempo e não podem discordar sobre o mesmo lugar. */}
                    {origin ? (
                      <span className="instrument-value shrink-0 text-[0.75rem] text-ink-faint">
                        {formatDistanceKm(
                          estimateRoadKm(haversineKm(origin, place)),
                        )}{' '}
                        km
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-[0.75rem] tracking-[0.1em] text-ink-faint uppercase">
                      {CATEGORY_LABELS[place.category]}
                    </span>
                    <VisitStatusBadge status={place.visitStatus} />
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
