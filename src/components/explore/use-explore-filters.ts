'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  DEFAULT_EXPLORE_FILTERS,
  type ExploreFilters,
} from '@/domain/filters'
import {
  PLACE_CATEGORIES,
  VISIT_STATUSES,
  type PlaceCategory,
  type VisitStatus,
} from '@/domain/place'

function parseList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return []
  const allowedSet = new Set<string>(allowed)
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is T => allowedSet.has(value))
}

function parseRadius(raw: string | null): number | null {
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : null
}

/**
 * `hasOrigin` decide se o parâmetro `raio` da URL vale.
 *
 * O ADR 0006 mantém a URL como fonte do estado de exploração — mas ela deixa de
 * poder afirmar um recorte que o perfil não sustenta. Sem origem, um raio de
 * 50 km seria medido a partir de lugar nenhum, então é ignorado em vez de
 * aplicado sobre um ponto inventado.
 */
export function useExploreFilters(hasOrigin: boolean) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = useMemo<ExploreFilters>(
    () => ({
      categories: parseList<PlaceCategory>(
        searchParams.get('cat'),
        PLACE_CATEGORIES,
      ),
      radiusKm: hasOrigin ? parseRadius(searchParams.get('raio')) : null,
      visitStatus: parseList<VisitStatus>(
        searchParams.get('status'),
        VISIT_STATUSES,
      ),
      favoritesOnly: searchParams.get('fav') === '1',
    }),
    [searchParams, hasOrigin],
  )

  const setFilters = useCallback(
    (next: ExploreFilters) => {
      // Preserva `place`: trocar um filtro não pode fechar um painel aberto,
      // que é escrito no mesmo `URLSearchParams` por `useSelectedPlace`.
      const params = new URLSearchParams(searchParams.toString())

      const assign = (key: string, value: string | null) => {
        if (value) params.set(key, value)
        else params.delete(key)
      }

      assign('cat', next.categories.join(',') || null)
      assign('raio', next.radiusKm ? String(next.radiusKm) : null)
      assign('status', next.visitStatus.join(',') || null)
      assign('fav', next.favoritesOnly ? '1' : null)

      const query = params.toString()
      // `replace` e não `push`: cada clique de chip não deve encher o histórico.
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const reset = useCallback(() => {
    setFilters(DEFAULT_EXPLORE_FILTERS)
  }, [setFilters])

  const isDefault =
    filters.categories.length === 0 &&
    filters.radiusKm === null &&
    filters.visitStatus.length === 0 &&
    !filters.favoritesOnly

  return { filters, setFilters, reset, isDefault }
}
