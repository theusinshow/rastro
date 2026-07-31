'use client'

import { useId } from 'react'
import { cn } from '@/lib/utils/cn'
import { InlineMessage } from './InlineMessage'

/**
 * Base compartilhada dos três controles. Estava colada à mão em cinco campos do
 * `PlaceForm` e em dois do `OriginSetup`, com a string de classe repetida
 * literalmente.
 */
const CONTROL =
  // `raised` e não `void`: o campo mora dentro de um painel translúcido com mapa
  // por baixo, e um fundo mais escuro que o painel abria um buraco na superfície.
  // Campo é elevação dentro do painel, como card e célula.
  'w-full rounded-md border border-line bg-raised px-4 text-ink ' +
  'placeholder:text-ink-faint transition-colors hover:border-line-strong ' +
  'focus:border-accent aria-invalid:border-alert ' +
  'disabled:pointer-events-none disabled:opacity-(--disabled-opacity)'

interface InputProps extends React.ComponentProps<'input'> {
  /** Liga a mono tabular: use em qualquer campo que receba uma medição. */
  numeric?: boolean
}

export function Input({ className, numeric, ...props }: InputProps) {
  return (
    <input
      className={cn(CONTROL, 'h-12', numeric && 'instrument-value', className)}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(CONTROL, 'min-h-28 resize-y py-3 leading-relaxed', className)}
      {...props}
    />
  )
}

export function Select({ className, ...props }: React.ComponentProps<'select'>) {
  return <select className={cn(CONTROL, 'h-12 pr-10', className)} {...props} />
}

interface FieldProps {
  label: string
  hint?: string
  error?: string
  /** Recebe os atributos que amarram rótulo, dica e erro ao controle. */
  children: (props: {
    id: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
  }) => React.ReactNode
  className?: string
}

/**
 * Junta rótulo, controle, dica e erro numa relação acessível.
 *
 * O `useId` é o ponto: sem ele, amarrar `<label htmlFor>` e `aria-describedby`
 * exigiria inventar um id por campo à mão — e foi exatamente o que os
 * formulários escritos antes deste componente não fizeram.
 */
export function Field({ label, hint, error, children, className }: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') ||
    undefined

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <label htmlFor={id} className="instrument-label">
        {label}
      </label>

      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}

      {/* A dica some quando há erro: dois textos de apoio embaixo do mesmo
          controle competem, e o erro é o que precisa ser lido. */}
      {hint && !error ? (
        <p id={hintId} className="text-small text-ink-faint">
          {hint}
        </p>
      ) : null}

      {error ? (
        <InlineMessage id={errorId} tone="error">
          {error}
        </InlineMessage>
      ) : null}
    </div>
  )
}
