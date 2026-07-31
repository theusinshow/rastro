import { cn } from '@/lib/utils/cn'

interface CloseButtonProps {
  onClick: () => void
  /** O que está sendo fechado. Vai para o rótulo acessível. */
  label?: string
  className?: string
}

/**
 * Fechar um painel.
 *
 * O glifo é pequeno de propósito — fechar não deve competir com o conteúdo —
 * mas o **alvo tem 44px**. Este é a única saída do painel e era o controle mais
 * difícil de acertar da interface inteira: um `×` de 14×18px, apontado como
 * P2.6 na auditoria.
 *
 * É `×` e não um ícone de biblioteca porque o produto não tem conjunto de
 * ícones, e um glifo que substitui a palavra "fechar" é o caso em que a regra
 * permite.
 */
export function CloseButton({
  onClick,
  label = 'Fechar painel',
  className,
}: CloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'press flex h-11 w-11 shrink-0 items-center justify-center rounded-full',
        'border border-line text-lead leading-none text-ink-faint',
        'hover:border-line-strong hover:bg-overlay hover:text-ink',
        className,
      )}
    >
      ×
    </button>
  )
}
