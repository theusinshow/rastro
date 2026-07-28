import { cn } from '@/lib/utils/cn'

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  /** Quantos itens este filtro deixaria no recorte. Opcional. */
  count?: number
}

/**
 * Filtro de um toque. 40px de altura porque o produto se usa com a mão suja e a
 * luva do lado — não é o lugar de espremer densidade.
 *
 * A ativação é instantânea: um filtro é uma chave, não um fade.
 */
export function Chip({
  active = false,
  count,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'press inline-flex h-10 items-center gap-2 rounded-full border px-4',
        'text-[1rem]',
        active
          ? 'border-accent bg-accent-dim/45 text-ink'
          : 'border-line-strong text-ink-muted hover:bg-overlay hover:text-ink',
        'disabled:pointer-events-none disabled:opacity-(--disabled-opacity)',
        className,
      )}
      {...props}
    >
      {children}
      {typeof count === 'number' ? (
        <span
          className={cn(
            'instrument-value text-[0.8125rem]',
            active ? 'text-accent' : 'text-ink-faint',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}
