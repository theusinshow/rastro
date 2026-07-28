'use client'

import { useCallback, useState, useTransition } from 'react'
import { formatCoordinate, type Coordinates } from '@/domain/geo'
import {
  CATEGORY_LABELS,
  PLACE_CATEGORIES,
  type NewPlace,
  type PlaceCategory,
} from '@/domain/place'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { PointPicker } from '@/components/map/PointPicker'
import { Button } from '@/components/ui/Button'
import type { ActionResult } from '@/app/actions/result'

const FIELD_CLASS =
  'mt-1.5 w-full rounded-xs border border-line bg-raised px-2 py-1.5 text-sm text-ink placeholder:text-ink-faint'

interface PlaceFormProps {
  initial?: Partial<NewPlace>
  submitLabel: string
  onSubmit: (input: NewPlace) => Promise<ActionResult>
  /** Com mira, a coordenada vem de um clique no mapa. Sem, ela é preservada. */
  picking: boolean
  /** Bloco extra abaixo do formulário — usado por "apagar" na edição. */
  footer?: React.ReactNode
}

/**
 * Formulário de lugar, compartilhado por criar e editar.
 *
 * A validação vive em `validateNewPlace`, no domínio, e roda dentro da Server
 * Action: componente visual não decide o que é lugar válido.
 */
export function PlaceForm({
  initial,
  submitLabel,
  onSubmit,
  picking,
  footer,
}: PlaceFormProps) {
  const [point, setPoint] = useState<Coordinates | null>(
    initial?.latitude !== undefined && initial?.longitude !== undefined
      ? { latitude: initial.latitude, longitude: initial.longitude }
      : null,
  )
  const [name, setName] = useState(initial?.name ?? '')
  const [category, setCategory] = useState<PlaceCategory>(
    initial?.category ?? 'serra',
  )
  const [municipality, setMunicipality] = useState(initial?.municipality ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tags, setTags] = useState((initial?.tags ?? []).join(', '))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Identidade estável: sem `useCallback`, o efeito do PointPicker remonta a
  // cada render e o modo de mira pisca.
  const handlePick = useCallback((picked: Coordinates) => {
    setPoint(picked)
  }, [])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!point) return

    startTransition(async () => {
      setError(null)
      const result = await onSubmit({
        name,
        description,
        latitude: point.latitude,
        longitude: point.longitude,
        municipality,
        category,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      })
      if (!result.ok) setError(result.message)
    })
  }

  return (
    <>
      {picking ? <PointPicker onPick={handlePick} /> : null}

      <OverlayPanel side="right">
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
            <div>
              <span className="instrument-label">Coordenada</span>
              <p className="instrument-value mt-1 text-sm text-ink">
                {point
                  ? `${formatCoordinate(point.latitude)} ${formatCoordinate(point.longitude)}`
                  : 'clique no mapa'}
              </p>
              {picking ? (
                <p className="mt-1 text-[10px] leading-relaxed text-ink-faint">
                  A barra de status mostra a coordenada sob o cursor.
                </p>
              ) : null}
            </div>

            <label className="block border-t border-line pt-3">
              <span className="instrument-label">Nome</span>
              <input
                type="text"
                value={name}
                maxLength={120}
                onChange={(event) => setName(event.target.value)}
                placeholder="Mirante da Serra"
                className={FIELD_CLASS}
              />
            </label>

            <label className="block">
              <span className="instrument-label">Categoria</span>
              <select
                value={category}
                onChange={(event) =>
                  setCategory(event.target.value as PlaceCategory)
                }
                className={FIELD_CLASS}
              >
                {PLACE_CATEGORIES.map((option) => (
                  <option key={option} value={option}>
                    {CATEGORY_LABELS[option]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="instrument-label">Município</span>
              <input
                type="text"
                value={municipality}
                onChange={(event) => setMunicipality(event.target.value)}
                placeholder="Urubici"
                className={FIELD_CLASS}
              />
            </label>

            <label className="block">
              <span className="instrument-label">Descrição</span>
              <textarea
                rows={3}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="O que faz este lugar valer a viagem."
                className={FIELD_CLASS}
              />
            </label>

            <label className="block">
              <span className="instrument-label">Etiquetas</span>
              <input
                type="text"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="curvas, mirante"
                className={FIELD_CLASS}
              />
              <span className="mt-1 block text-[10px] text-ink-faint">
                Separadas por vírgula.
              </span>
            </label>

            {error ? (
              <p className="text-[11px] leading-relaxed text-ink-muted">{error}</p>
            ) : null}

            <Button
              type="submit"
              variant="solid"
              size="sm"
              disabled={!point || pending}
              className="w-full"
            >
              {pending ? 'Gravando…' : submitLabel}
            </Button>
          </div>

          {footer}
        </form>
      </OverlayPanel>
    </>
  )
}
