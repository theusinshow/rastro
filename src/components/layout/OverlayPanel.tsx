import { cn } from '@/lib/utils/cn'

interface OverlayPanelProps {
  side: 'left' | 'right'
  /** Largura em pixels a partir de 768px. Padrão: 380 à direita, 232 à esquerda. */
  width?: number
  /**
   * A saída está em andamento e o nó continua montado só para a animação
   * terminar. Ver `useExitTransition`.
   */
  exiting?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Painel sobre o mapa.
 *
 * Geometria e movimento vivem em `.overlay-panel`, em `globals.css`: abaixo de
 * 768px o painel vira folha inferior, e a entrada depende de `@starting-style`,
 * que não tem equivalente em utilitária do Tailwind.
 */
export function OverlayPanel({
  side,
  width,
  exiting = false,
  className,
  children,
}: OverlayPanelProps) {
  return (
    <aside
      data-side={side}
      data-exiting={exiting}
      style={
        {
          '--panel-width': `${width ?? (side === 'right' ? 380 : 232)}px`,
        } as React.CSSProperties
      }
      className={cn(
        'overlay-panel border-line bg-base/95 backdrop-blur-sm',
        className,
      )}
    >
      {children}
    </aside>
  )
}
