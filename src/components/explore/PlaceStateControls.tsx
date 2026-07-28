'use client'

import { useOptimistic, useState, useTransition } from 'react'
import type { ExplorePlace } from '@/domain/place'
import {
  setFavoriteAction,
  setWantsToVisitAction,
} from '@/app/actions/place-state-actions'
import { cn } from '@/lib/utils/cn'

const BASE_CLASS =
  'press rounded-xs border px-2 py-1.5 text-[10px] uppercase tracking-[0.14em] transition-colors'
const INACTIVE_CLASS = 'border-line text-ink-faint hover:text-ink-muted'

/**
 * As duas chaves do vínculo com um lugar, no vocabulário do mapa.
 *
 * O estado ativo usa exatamente as cores do pin — âmbar do anel para favorito,
 * âmbar de "quero conhecer" para o preenchimento — e não uma cor de formulário:
 * o painel conta a mesma história que o mapa, com o mesmo código. Ver ADR 0005.
 *
 * Registrar visita NÃO mora aqui. É evento, não chave: acumula linhas em
 * `place_visits` em vez de alternar um booleano, e mistura-lo a estes dois
 * sugeriria que "visitado" pode ser desmarcado — o que só seria implementável
 * apagando memória. Ver `PlaceVisits`.
 *
 * `useOptimistic` porque uma ida ao servidor num toggle devolveria ao produto a
 * inércia que o passe de movimento tirou dele. O pin muda no quadro seguinte ao
 * toque; se o servidor recusar, volta com a razão em texto.
 */
export function PlaceStateControls({ place }: { place: ExplorePlace }) {
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [favorite, setFavorite] = useOptimistic(place.isFavorite)
  const [wanted, setWanted] = useOptimistic(
    place.visitStatus === 'quero-conhecer',
  )

  function toggle(
    current: boolean,
    setOptimistic: (value: boolean) => void,
    action: (id: string, value: boolean) => Promise<{ ok: boolean; message?: string }>,
  ) {
    const next = !current
    startTransition(async () => {
      setOptimistic(next)
      setError(null)
      const result = await action(place.id, next)
      if (!result.ok) setError(result.message ?? 'Não foi possível salvar.')
    })
  }

  return (
    <div className="border-b border-line px-5 py-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toggle(favorite, setFavorite, setFavoriteAction)}
          aria-pressed={favorite}
          className={cn(
            BASE_CLASS,
            favorite ? 'border-accent text-accent' : INACTIVE_CLASS,
          )}
        >
          Favorito
        </button>

        <button
          type="button"
          onClick={() => toggle(wanted, setWanted, setWantsToVisitAction)}
          aria-pressed={wanted}
          className={cn(
            BASE_CLASS,
            wanted ? 'border-wanted text-wanted' : INACTIVE_CLASS,
          )}
        >
          Quero conhecer
        </button>
      </div>

      {/* Uma visita registrada vence o interesse na leitura do pin. Dizer isso
          evita que o botão pareça quebrado em lugar já visitado. */}
      {place.visitStatus === 'visitado' && wanted ? (
        <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
          Você já esteve aqui, então o pin mostra visitado.
        </p>
      ) : null}

      {error ? (
        <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">{error}</p>
      ) : null}
    </div>
  )
}
