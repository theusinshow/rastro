'use client'

import Link from 'next/link'
import type { ExploreFilters, FilterRelaxation } from '@/domain/filters'
import { RADIUS_OPTIONS_KM } from '@/domain/filters'
import {
  CATEGORY_LABELS,
  PLACE_CATEGORIES,
  type ExplorePlace,
  type PlaceCategory,
  type VisitStatus,
} from '@/domain/place'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Toggle } from '@/components/ui/Toggle'
import { PlaceList } from './PlaceList'

const STATUS_OPTIONS: Array<{ value: VisitStatus; label: string }> = [
  { value: 'nao-visitado', label: 'Não visitados' },
  { value: 'quero-conhecer', label: 'Quero conhecer' },
  { value: 'visitado', label: 'Já visitados' },
]

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

interface FilterRailProps {
  filters: ExploreFilters
  setFilters: (filters: ExploreFilters) => void
  reset: () => void
  isDefault: boolean
  visible: ExplorePlace[]
  totalCount: number
  selectedSlug: string | null
  onSelectPlace: (slug: string) => void
  onHoverPlace: (slug: string | null) => void
  relaxation: FilterRelaxation | null
  /** Sem origem no perfil não há de onde medir raio. */
  hasOrigin: boolean
}

export function FilterRail({
  filters,
  setFilters,
  reset,
  isDefault,
  visible,
  totalCount,
  selectedSlug,
  onSelectPlace,
  onHoverPlace,
  relaxation,
  hasOrigin,
}: FilterRailProps) {
  return (
    <OverlayPanel side="left">
      {/* No desktop os filtros tomam a altura que precisam, com teto de 60% da
          coluna, e a lista fica com o resto — assim nada é cortado no meio de
          uma linha. Na folha inferior a altura é indefinida e a divisão volta a
          ser proporcional, que é o único repartimento previsível ali. */}
      <div className="min-h-0 flex-1 overflow-y-auto md:max-h-[60%] md:flex-none">
        <section className="border-b border-line px-4 py-4">
          <span className="instrument-label">Categoria</span>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {PLACE_CATEGORIES.map((category: PlaceCategory) => (
              <Chip
                key={category}
                active={filters.categories.includes(category)}
                onClick={() =>
                  setFilters({
                    ...filters,
                    categories: toggleInList(filters.categories, category),
                  })
                }
              >
                {CATEGORY_LABELS[category]}
              </Chip>
            ))}
          </div>
        </section>

        <section className="border-b border-line px-4 py-4">
          <span className="instrument-label">Raio em linha reta</span>
          {/* Indisponível com a razão dita, e não desabilitado em silêncio: sem
              origem no perfil não existe ponto de onde medir. */}
          {hasOrigin ? (
            <div className="mt-2.5 flex flex-wrap gap-1">
              {RADIUS_OPTIONS_KM.map((radius) => (
                <Chip
                  key={radius}
                  active={filters.radiusKm === radius}
                  onClick={() =>
                    setFilters({
                      ...filters,
                      radiusKm: filters.radiusKm === radius ? null : radius,
                    })
                  }
                >
                  {radius} km
                </Chip>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
              O raio precisa de uma origem.{' '}
              <Link href="/perfil/origem" className="text-accent">
                Defina a sua
              </Link>
              .
            </p>
          )}
        </section>

        <section className="px-4 py-4">
          <span className="instrument-label">Situação</span>
          <div className="mt-1.5">
            {STATUS_OPTIONS.map((option) => (
              <Toggle
                key={option.value}
                label={option.label}
                checked={filters.visitStatus.includes(option.value)}
                onChange={() =>
                  setFilters({
                    ...filters,
                    visitStatus: toggleInList(filters.visitStatus, option.value),
                  })
                }
              />
            ))}
            <Toggle
              label="Somente favoritos"
              checked={filters.favoritesOnly}
              onChange={(checked) =>
                setFilters({ ...filters, favoritesOnly: checked })
              }
            />
          </div>
        </section>
      </div>

      {/* A lista ocupa o terço de coluna que antes era `bg-base` liso, e é o
          único caminho de teclado até um lugar — ver `PlaceList`. */}
      <PlaceList
        className="min-h-0 flex-1 border-t border-line"
        places={visible}
        totalCount={totalCount}
        selectedSlug={selectedSlug}
        onSelect={onSelectPlace}
        onHover={onHoverPlace}
        relaxation={relaxation}
        onRelax={setFilters}
        onReset={reset}
      />

      <div className="flex shrink-0 items-center justify-end border-t border-line px-4 py-2">
        <Button size="sm" variant="ghost" onClick={reset} disabled={isDefault}>
          Limpar
        </Button>
      </div>
    </OverlayPanel>
  )
}
