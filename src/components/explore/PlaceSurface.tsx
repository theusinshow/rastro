'use client'

import { useOptimistic, useState, useTransition } from 'react'
import {
  ACCESS_SURFACES,
  ACCESS_SURFACE_LABELS,
  type AccessSurface,
  type ExplorePlace,
} from '@/domain/place'
import { setAccessSurfaceAction } from '@/app/actions/place-state-actions'
import { Chip } from '@/components/ui/Chip'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { SectionHeader } from '@/components/ui/Section'

/**
 * O piso do acesso, declarado por quem foi.
 *
 * Nasce **em branco**, e em branco significa "não sei" — nunca asfalto. Por isso
 * não há opção pré-marcada e não há "desconhecido" na lista: tocar de novo no
 * piso marcado desmarca, do mesmo jeito que a nota de uma visita.
 *
 * Vive no painel do lugar e não no formulário de edição porque a informação é
 * pessoal e vale para lugar do catálogo também — que ninguém pode editar.
 */
export function PlaceSurface({ place }: { place: ExplorePlace }) {
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const [surface, setSurface] = useOptimistic(place.accessSurface)

  function choose(value: AccessSurface) {
    // Tocar no que já está marcado volta para "não sei". Sem isso, uma marcação
    // errada seria permanente.
    const next = surface === value ? null : value
    startTransition(async () => {
      setSurface(next)
      setError(null)
      const result = await setAccessSurfaceAction(place.id, next)
      if (!result.ok) setError(result.message ?? 'Não foi possível salvar.')
    })
  }

  return (
    <div className="border-b border-line px-5 py-3">
      <SectionHeader label="Piso do acesso" />

      <div className="mt-2.5 flex flex-wrap gap-2">
        {ACCESS_SURFACES.map((value) => (
          <Chip
            key={value}
            active={surface === value}
            onClick={() => choose(value)}
          >
            {ACCESS_SURFACE_LABELS[value]}
          </Chip>
        ))}
      </div>

      {/* Diz o que o branco significa, uma vez, em vez de deixar o vazio ser
          lido como "asfalto" por omissão. */}
      {surface === null ? (
        <p className="mt-2.5 text-small leading-relaxed text-ink-faint">
          Ninguém marcou ainda. Marque quando for — o que vale é o que você viu.
        </p>
      ) : null}

      {error ? (
        <InlineMessage tone="error" className="mt-3">
          {error}
        </InlineMessage>
      ) : null}
    </div>
  )
}
