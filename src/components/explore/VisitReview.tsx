'use client'

import { useState, useTransition } from 'react'
import { updateVisitReviewAction } from '@/app/actions/place-state-actions'
import { MAX_NOTE_LENGTH } from '@/domain/review'
import type { PlaceVisit } from '@/domain/place'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Field'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { RatingPicker } from '@/components/ui/RatingPicker'

/**
 * Como foi esta passagem.
 *
 * Fica fechado por padrão: a lista de visitas é uma linha do tempo, e abrir
 * cinco caixas de texto empilhadas a transformaria num formulário. Quem quer
 * relatar, abre.
 */
export function VisitReview({ visit }: { visit: PlaceVisit }) {
  const [open, setOpen] = useState(visit.notes !== null || visit.rating !== null)
  const [rating, setRating] = useState(visit.rating)
  const [notes, setNotes] = useState(visit.notes ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function save(proximaNota: number | null, proximoTexto: string) {
    startTransition(async () => {
      setError(null)
      setSaved(false)
      const result = await updateVisitReviewAction(
        visit.id,
        proximaNota,
        proximoTexto,
      )
      if (!result.ok) setError(result.message)
      else setSaved(true)
    })
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Como foi?
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <RatingPicker
        value={rating}
        disabled={pending}
        onChange={(proxima) => {
          setRating(proxima)
          // Nota grava no toque: é um clique só, e pedir "salvar" depois dele
          // seria um passo a mais para um dado que já está completo.
          save(proxima, notes)
        }}
      />

      <Textarea
        value={notes}
        maxLength={MAX_NOTE_LENGTH}
        placeholder="Fechada de neblina, subi de novo no mês seguinte."
        aria-label="Relato desta visita"
        disabled={pending}
        onChange={(event) => {
          setNotes(event.target.value)
          setSaved(false)
        }}
        className="min-h-20"
      />

      {/*
        Botão explícito, e não gravação ao sair do campo.

        Salvar no `blur` é mágica invisível: no celular fechar o teclado nem
        sempre borra o campo, e quem escreveu fica sem saber se foi guardado.
        Foi assim que um relato se perdeu em silêncio no teste — a nota gravou e
        o texto não, sem nenhum aviso na tela.

        O botão só aparece quando há o que gravar: sem alteração pendente ele
        seria um controle que não faz nada.
      */}
      {notes !== (visit.notes ?? '') ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => save(rating, notes)}
        >
          {pending ? 'Gravando…' : 'Gravar relato'}
        </Button>
      ) : null}

      {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}
      {saved && !error ? (
        <span className="instrument-label text-ok">gravado</span>
      ) : null}
    </div>
  )
}
