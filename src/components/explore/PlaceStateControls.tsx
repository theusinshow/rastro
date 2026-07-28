'use client'

import { useOptimistic, useState, useTransition } from 'react'
import type { ExplorePlace } from '@/domain/place'
import { setFavoriteAction } from '@/app/actions/place-state-actions'
import { cn } from '@/lib/utils/cn'

/**
 * Favorito, no vocabulário do mapa.
 *
 * O estado ativo usa o mesmo âmbar do anel de favorito do pin, e não uma cor de
 * formulário: o painel conta a mesma história que o mapa, com o mesmo código de
 * cor. Ver ADR 0005.
 *
 * `useOptimistic` porque uma ida ao servidor num toggle devolveria ao produto a
 * inércia que o passe de movimento tirou dele. O pin muda no quadro seguinte ao
 * toque; se o servidor recusar, volta com a razão em texto.
 */
export function PlaceStateControls({ place }: { place: ExplorePlace }) {
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [favorite, setFavorite] = useOptimistic(place.isFavorite)

  function toggleFavorite() {
    const next = !favorite
    startTransition(async () => {
      setFavorite(next)
      setError(null)
      const result = await setFavoriteAction(place.id, next)
      if (!result.ok) setError(result.message)
    })
  }

  return (
    <div className="border-b border-line px-5 py-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={toggleFavorite}
          aria-pressed={favorite}
          className={cn(
            'press rounded-xs border px-2 py-1.5 text-[10px] uppercase',
            'tracking-[0.14em] transition-colors',
            favorite
              ? 'border-accent text-accent'
              : 'border-line text-ink-faint hover:text-ink-muted',
          )}
        >
          Favorito
        </button>
      </div>

      {error ? (
        <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">{error}</p>
      ) : null}
    </div>
  )
}
