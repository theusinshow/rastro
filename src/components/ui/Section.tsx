import { cn } from '@/lib/utils/cn'

/**
 * Seção de painel — o substituto do card.
 *
 * O produto não usa card para conteúdo primário: a divisão vem de hairline
 * dentro de um painel que já é estrutura de layout. A borda superior aparece a
 * partir da segunda seção, para que a primeira encoste no cabeçalho do painel.
 */
export function PanelSection({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('border-line px-5 py-4 not-first:border-t', className)}
      {...props}
    />
  )
}

interface SectionHeaderProps {
  label: string
  hint?: string
  /** Controle alinhado à direita — "Limpar", contagem, link. */
  action?: React.ReactNode
  className?: string
}

/**
 * Rótulo de instrumento com conteúdo opcional à direita.
 *
 * Elimina a repetição de cerca de doze cabeçalhos montados à mão como
 * `<span className="instrument-label">` solto.
 */
export function SectionHeader({
  label,
  hint,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', className)}>
      <div className="flex items-baseline gap-3">
        <span className="instrument-label">{label}</span>
        {hint ? (
          <span className="text-[0.9375rem] text-ink-faint">{hint}</span>
        ) : null}
      </div>
      {action}
    </div>
  )
}

/** Hairline nomeado, no lugar de um `border-t border-line` solto. */
export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-line', className)} />
}
