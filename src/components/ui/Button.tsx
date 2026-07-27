import { cn } from '@/lib/utils/cn'

type ButtonVariant = 'solid' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const VARIANT: Record<ButtonVariant, string> = {
  solid: 'bg-accent text-void hover:opacity-90',
  outline:
    'border border-line-strong text-ink hover:border-accent hover:text-accent',
  ghost: 'text-ink-muted hover:text-ink hover:bg-overlay',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-[11px]',
  md: 'h-9 px-4 text-xs',
}

export function Button({
  variant = 'outline',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        // `press` traz a transição: ver `.press` em globals.css.
        'press inline-flex items-center justify-center gap-2 rounded-xs',
        'font-medium uppercase tracking-[0.1em]',
        // 55% em vez de 40%: a 40% o rótulo media 3.42:1, o que contradiz a
        // regra de manter visível o que está explicitamente indisponível.
        'disabled:cursor-not-allowed disabled:opacity-55',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    />
  )
}
