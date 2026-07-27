'use client'

import {
  TIME_BUDGET_LABELS,
  TIME_BUDGET_MINUTES,
  type DiscoveryQuery,
  type TimeBudget,
} from '@/domain/discovery'
import { RADIUS_OPTIONS_KM } from '@/domain/filters'
import {
  CATEGORY_LABELS,
  PLACE_CATEGORIES,
  type PlaceCategory,
} from '@/domain/place'
import { DEFAULT_ORIGIN_LABEL } from '@/mocks/user'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Toggle } from '@/components/ui/Toggle'

const TIME_BUDGETS = Object.keys(TIME_BUDGET_MINUTES) as TimeBudget[]

interface DiscoveryFormProps {
  query: DiscoveryQuery
  onChange: (query: DiscoveryQuery) => void
  onSubmit: () => void
}

export function DiscoveryForm({ query, onChange, onSubmit }: DiscoveryFormProps) {
  return (
    <OverlayPanel side="left" width={272}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto">
          <section className="border-b border-line px-4 py-4">
            <span className="instrument-label">Partida</span>
            <p className="instrument-value mt-1.5 text-sm text-ink">
              {DEFAULT_ORIGIN_LABEL}
            </p>
            <p className="mt-1 text-[10px] text-ink-faint">
              Escolher outra origem entra numa próxima etapa.
            </p>
          </section>

          <section className="border-b border-line px-4 py-4">
            <span className="instrument-label">Tempo disponível</span>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {TIME_BUDGETS.map((budget) => (
                <Chip
                  key={budget}
                  active={query.timeBudget === budget}
                  onClick={() => onChange({ ...query, timeBudget: budget })}
                >
                  {TIME_BUDGET_LABELS[budget]}
                </Chip>
              ))}
            </div>
          </section>

          <section className="border-b border-line px-4 py-4">
            <span className="instrument-label">Distância máxima</span>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {RADIUS_OPTIONS_KM.map((radius) => (
                <Chip
                  key={radius}
                  active={query.maxDistanceKm === radius}
                  onClick={() => onChange({ ...query, maxDistanceKm: radius })}
                >
                  {radius} km
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
              Quilometragem de estrada estimada, só de ida.
            </p>
          </section>

          <section className="border-b border-line px-4 py-4">
            <span className="instrument-label">Categorias</span>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {PLACE_CATEGORIES.map((category: PlaceCategory) => (
                <Chip
                  key={category}
                  active={query.categories.includes(category)}
                  onClick={() =>
                    onChange({
                      ...query,
                      categories: query.categories.includes(category)
                        ? query.categories.filter((item) => item !== category)
                        : [...query.categories, category],
                    })
                  }
                >
                  {CATEGORY_LABELS[category]}
                </Chip>
              ))}
            </div>
          </section>

          <section className="px-4 py-4">
            <Toggle
              label="Somente lugares não visitados"
              checked={query.onlyUnvisited}
              onChange={(checked) => onChange({ ...query, onlyUnvisited: checked })}
            />
            <Toggle
              label="Somente favoritos"
              checked={query.onlyFavorites}
              onChange={(checked) => onChange({ ...query, onlyFavorites: checked })}
            />
          </section>
        </div>

        <div className="border-t border-line p-3">
          <Button type="submit" variant="solid" className="w-full">
            Encontrar destino
          </Button>
        </div>
      </form>
    </OverlayPanel>
  )
}
