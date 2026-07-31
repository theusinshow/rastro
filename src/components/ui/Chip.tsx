import { cn } from '@/lib/utils/cn'

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
  /** Quantos itens este filtro deixaria no recorte. Opcional. */
  count?: number
}

/**
 * Filtro de um toque. **44px**, que é o piso de alvo do produto inteiro: ele se
 * usa parado no acostamento, com luva. Não é o lugar de espremer densidade.
 *
 * A ativação é instantânea: um filtro é uma chave, não um fade.
 *
 * O inativo ganhou superfície própria (`raised`) em vez de só contorno. Sobre um
 * painel translúcido com mapa por baixo, contorno sozinho some quando o que
 * passa embaixo é relevo claro — e o chip deixava de parecer clicável.
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
        'press inline-flex h-11 items-center gap-2.5 rounded-full border px-4',
        'text-small',
        active
          ? 'border-accent/55 bg-accent/14 text-ink'
          : 'border-line bg-raised text-ink-muted hover:bg-overlay hover:text-ink',
        'disabled:pointer-events-none disabled:opacity-(--disabled-opacity)',
        className,
      )}
      {...props}
    >
      {children}
      {typeof count === 'number' ? (
        <span
          className={cn(
            'instrument-value text-micro',
            active ? 'text-accent' : 'text-ink-faint',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}
