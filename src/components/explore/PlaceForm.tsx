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
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { SectionHeader } from '@/components/ui/Section'
import type { ActionResult } from '@/app/actions/result'

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
            <div className="flex flex-col gap-2">
              <SectionHeader label="Coordenada" />
              <p className="instrument-value text-lead text-ink">
                {point
                  ? `${formatCoordinate(point.latitude)} ${formatCoordinate(point.longitude)}`
                  : 'clique no mapa'}
              </p>
              {picking ? (
                <p className="text-small leading-relaxed text-ink-faint">
                  A barra de status mostra a coordenada sob o cursor.
                </p>
              ) : null}
            </div>

            <Field label="Nome" className="border-t border-line pt-4">
              {(field) => (
                <Input
                  {...field}
                  type="text"
                  value={name}
                  maxLength={120}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Mirante da Serra"
                />
              )}
            </Field>

            <Field label="Categoria">
              {(field) => (
                <Select
                  {...field}
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value as PlaceCategory)
                  }
                >
                  {PLACE_CATEGORIES.map((option) => (
                    <option key={option} value={option}>
                      {CATEGORY_LABELS[option]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label="Município">
              {(field) => (
                <Input
                  {...field}
                  type="text"
                  value={municipality}
                  onChange={(event) => setMunicipality(event.target.value)}
                  placeholder="Urubici"
                />
              )}
            </Field>

            <Field label="Descrição">
              {(field) => (
                <Textarea
                  {...field}
                  rows={3}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="O que faz este lugar valer a viagem."
                />
              )}
            </Field>

            <Field label="Etiquetas" hint="Separadas por vírgula.">
              {(field) => (
                <Input
                  {...field}
                  type="text"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="curvas, mirante"
                />
              )}
            </Field>

            {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}

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
