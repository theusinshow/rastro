'use client'

import type { ExploreFilters } from '@/domain/filters'
import { RADIUS_OPTIONS_KM } from '@/domain/filters'
import {
  CATEGORY_LABELS,
  PLACE_CATEGORIES,
  type PlaceCategory,
  type VisitStatus,
} from '@/domain/place'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Toggle } from '@/components/ui/Toggle'

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
  resultCount: number
  totalCount: number
}

export function FilterRail({
  filters,
  setFilters,
  reset,
  isDefault,
  resultCount,
  totalCount,
}: FilterRailProps) {
  return (
    <OverlayPanel side="left">
      <div className="flex-1 overflow-y-auto">
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
        </section>

        <section className="border-b border-line px-4 py-4">
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

      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <span className="instrument-value text-[10px] text-ink-faint">
          {resultCount} / {totalCount}
        </span>
        <Button size="sm" variant="ghost" onClick={reset} disabled={isDefault}>
          Limpar
        </Button>
      </div>
    </OverlayPanel>
  )
}
