import { cn } from '@/lib/utils/cn'

type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const VARIANT: Record<ButtonVariant, string> = {
  // `accent-fill`, e não `accent`: no tema claro o acento é a cor de TEXTO, um
  // marrom de 6.42:1 — preenchendo um botão, ele receberia por cima a tinta
  // quase preta de `--color-on-accent` e o rótulo sumiria.
  solid: 'bg-accent-fill text-on-accent hover:bg-accent-fill-strong',
  outline:
    'border border-line-strong text-ink hover:border-accent hover:bg-overlay',
  ghost: 'text-ink-muted hover:bg-overlay hover:text-ink',
  // Ação destrutiva. Contorno em repouso e preenchimento só no hover: apagar não
  // deve competir em peso com a ação principal do painel onde mora.
  danger:
    'border border-alert/45 text-alert hover:border-alert hover:bg-alert hover:text-void',
}

const SIZE: Record<ButtonSize, string> = {
  // 44px onde há dedo, 40px onde há mouse. O piso de 44 não é enfeite aqui: o
  // produto é usado parado no acostamento, com luva — o mesmo motivo do piso de
  // 17px no corpo de texto. Medido em 390px, `sm` entregava 40px.
  //
  // Raio cheio, e não `sm`/`md`: botão é o que se aperta, e a pílula é a forma
  // do que se aperta neste sistema. Retângulo arredondado ficou reservado a
  // superfície — card, campo, célula —, que é o que se lê.
  sm: 'h-11 rounded-full px-4 text-small md:h-10',
  md: 'h-12 rounded-full px-5 text-body',
  lg: 'h-14 rounded-full px-7 text-lead',
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
