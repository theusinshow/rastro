'use client'

import {
  TIME_BUDGET_LABELS,
  TIME_BUDGET_MINUTES,
  type DiscoveryQuery,
  type TimeBudget,
} from '@/domain/discovery'
import { RADIUS_OPTIONS_KM } from '@/domain/filters'
import Link from 'next/link'
import {
  CATEGORY_LABELS,
  PLACE_CATEGORIES,
  type PlaceCategory,
} from '@/domain/place'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { useOrigin } from '@/components/layout/origin-context'
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
  const { label: originLabel } = useOrigin()

  return (
    <OverlayPanel side="left" width={272}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <div className="min-h-0 flex-1 overflow-y-auto">
          <section className="border-b border-line px-4 py-4">
            <span className="instrument-label">Partida</span>
            <p className="instrument-value mt-1.5 text-body text-ink">
              {originLabel ?? '—'}
            </p>
            <Link
              href="/perfil/origem"
              className="mt-1 inline-block text-micro text-ink-faint
                         transition-colors hover:text-ink-muted"
            >
              Mudar ponto de partida
            </Link>
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
            <p className="mt-2 text-micro leading-relaxed text-ink-faint">
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

        <div className="shrink-0 border-t border-line p-3">
          <Button type="submit" variant="solid" className="w-full">
            Encontrar destino
          </Button>
        </div>
      </form>
    </OverlayPanel>
  )
}
