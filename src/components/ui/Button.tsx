import { cn } from '@/lib/utils/cn'

type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const VARIANT: Record<ButtonVariant, string> = {
  solid: 'bg-accent text-on-accent hover:bg-accent-strong',
  outline:
    'border border-line-strong text-ink hover:border-accent hover:bg-overlay',
  ghost: 'text-ink-muted hover:bg-overlay hover:text-ink',
  // Ação destrutiva. Contorno em repouso e preenchimento só no hover: apagar não
  // deve competir em peso com a ação principal do painel onde mora.
  danger:
    'border border-alert/45 text-alert hover:border-alert hover:bg-alert hover:text-void',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-10 rounded-sm px-3.5 text-[0.9375rem]',
  md: 'h-12 rounded-md px-5 text-[1.0625rem]',
  lg: 'h-14 rounded-lg px-7 text-[1.1875rem]',
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
        'press inline-flex shrink-0 items-center justify-center gap-2',
        'font-medium tracking-[0.02em]',
        // Mantém o rótulo legível: ação não implementada fica visivelmente
        // presente e explicitamente indisponível, nunca oculta em silêncio.
        'disabled:pointer-events-none disabled:opacity-(--disabled-opacity)',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    />
  )
}
