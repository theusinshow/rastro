'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  RADIUS_OPTIONS_KM,
  countActiveCriteria,
  describeFilters,
  type ExploreFilters,
  type FilterRelaxation,
} from '@/domain/filters'
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
import { CloseButton } from '@/components/ui/CloseButton'
import { SectionHeader } from '@/components/ui/Section'
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

/**
 * Trilha da esquerda, em dois modos: lista por padrão, filtros sob demanda.
 *
 * Antes desta separação os quatro blocos de filtro somavam **1017px numa coluna
 * de 861px**. Medido no navegador: a seção "Situação" ficava cortada ao meio e
 * seus quatro controles não apareciam na tela, havia três regiões rolando por
 * dentro de uma coluna de 232px, e a lista de lugares sobrava com 287px
 * mostrando 4 de 14.
 *
 * A prioridade estava invertida. **Filtrar é um momento; ler o recorte é o
 * estado** — e a lista é o único caminho de teclado até um lugar, além de ser a
 * costura entre lista e mapa. Agora o recorte fica descrito em palavras na barra
 * do topo, e o conjunto completo de controles abre por cima quando alguém quer
 * mexer.
 */
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
  const [editing, setEditing] = useState(false)
  const activeCount = countActiveCriteria(filters)
  const resumo = describeFilters(filters, CATEGORY_LABELS)

  if (editing) {
    return (
      // A folha padrão de 45vh não segura o conjunto de filtros: medido em
      // 390px de largura, eles somam 538px numa folha de 380px, e nenhum dos
      // quatro controles de situação aparecia sem rolar.
      <OverlayPanel side="left" sheetHeight="88vh">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-line py-2 pr-2 pl-4">
          <span className="instrument-label">Filtrar</span>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={reset} disabled={isDefault}>
              Limpar
            </Button>
            <CloseButton
              onClick={() => setEditing(false)}
              label="Fechar os filtros"
            />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <section className="border-b border-line px-4 py-4">
            <SectionHeader label="Categoria" />
            <div className="mt-3 flex flex-wrap gap-1.5">
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
            <SectionHeader label="Raio em linha reta" />
            {/* Indisponível com a razão dita, e não desabilitado em silêncio:
                sem origem no perfil não existe ponto de onde medir. */}
            {hasOrigin ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
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
              <p className="mt-2 text-small leading-relaxed text-ink-muted">
                O raio precisa de uma origem.{' '}
                <Link href="/perfil/origem" className="text-accent">
                  Defina a sua
                </Link>
                .
              </p>
            )}
          </section>

          <section className="px-4 py-4">
            <SectionHeader label="Situação" />
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

        {/* Diz quanto sobrou antes de fechar. Sem isto, mexer num filtro e voltar
            para a lista é um salto no escuro. */}
        <div className="shrink-0 border-t border-line p-3">
          <Button
            variant="solid"
            className="w-full"
            onClick={() => setEditing(false)}
          >
            Ver {visible.length} {visible.length === 1 ? 'lugar' : 'lugares'}
          </Button>
        </div>
      </OverlayPanel>
    )
  }

  return (
    <OverlayPanel side="left">
      <div className="shrink-0 border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={activeCount > 0 ? 'solid' : 'outline'}
            onClick={() => setEditing(true)}
          >
            Filtrar
            {activeCount > 0 ? (
              <span className="instrument-value">{activeCount}</span>
            ) : null}
          </Button>
          {activeCount > 0 ? (
            <Button size="sm" variant="ghost" onClick={reset}>
              Limpar
            </Button>
          ) : null}
        </div>

        {/* O recorte em palavras. Quem não abriu os filtros continua sabendo o
            que está escondendo lugares do mapa — antes isso só existia dentro
            dos controles, e os controles estavam cortados. */}
        {resumo.length > 0 ? (
          <p className="mt-2 text-small leading-snug text-ink-muted">
            {resumo.join(' · ')}
          </p>
        ) : null}
      </div>

      <PlaceList
        className="min-h-0 flex-1"
        places={visible}
        totalCount={totalCount}
        selectedSlug={selectedSlug}
        onSelect={onSelectPlace}
        onHover={onHoverPlace}
        relaxation={relaxation}
        onRelax={setFilters}
        onReset={reset}
      />
    </OverlayPanel>
  )
}
