import { cn } from '@/lib/utils/cn'

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function Chip({ active = false, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'relative h-6 rounded-xs border px-2 text-[10px] uppercase',
        'tracking-[0.12em] transition-colors',
        // A caixa visual continua com 24px — a densidade é parte da linguagem.
        // O que cresce para 32px é só a área clicável.
        'before:absolute before:inset-x-0 before:-inset-y-1 before:content-[""]',
        active
          ? 'border-accent text-accent'
          : 'border-line text-ink-faint hover:border-line-strong hover:text-ink-muted',
        className,
      )}
      {...props}
    />
  )
}
