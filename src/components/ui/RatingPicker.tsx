'use client'

import { RATING_LABELS } from '@/domain/review'
import { cn } from '@/lib/utils/cn'

interface RatingPickerProps {
  value: number | null
  onChange: (rating: number | null) => void
  disabled?: boolean
}

const NOTAS = [1, 2, 3, 4, 5] as const

/**
 * Nota de 1 a 5.
 *
 * **Sem estrelas.** O ADR 0011 libera glifo só na navegação principal, e uma
 * fileira de estrelas é justamente o tipo de ícone decorativo que a direção
 * visual recusa. O número em mono é o vocabulário que este produto já usa para
 * tudo que é medida.
 *
 * O rótulo do que está escolhido aparece por extenso ao lado: "4" não diz se é
 * bom ou decepcionante — "muito boa" diz, e continua dizendo daqui a cinco anos.
 *
 * Tocar na nota já escolhida a remove. Não dar nota é uma resposta, e sem isso
 * um toque errado seria permanente.
 */
export function RatingPicker({ value, onChange, disabled }: RatingPickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1">
        {NOTAS.map((nota) => (
          <button
            key={nota}
            type="button"
            disabled={disabled}
            aria-pressed={value === nota}
            aria-label={`${nota} — ${RATING_LABELS[nota]}`}
            onClick={() => onChange(value === nota ? null : nota)}
            className={cn(
              'press instrument-value flex h-11 w-11 items-center justify-center',
              'rounded-sm border text-body md:h-9 md:w-9',
              value === nota
                ? 'border-accent bg-accent/14 text-accent'
                : 'border-line-strong text-ink-faint hover:border-ink-faint hover:text-ink-muted',
            )}
          >
            {nota}
          </button>
        ))}
      </div>

      {value !== null ? (
        <span className="text-small text-ink-muted">{RATING_LABELS[value as 1 | 2 | 3 | 4 | 5]}</span>
      ) : (
        <span className="text-small text-ink-faint">sem nota</span>
      )}
    </div>
  )
}
