import { cn } from '@/lib/utils/cn'

interface OverlayPanelProps {
  side: 'left' | 'right'
  /** Largura em pixels. Padrão: 380 à direita, 232 à esquerda. */
  width?: number
  className?: string
  children: React.ReactNode
}

const SIDE_CLASS = {
  left: 'left-0 border-r',
  right: 'right-0 border-l',
} as const

export function OverlayPanel({
  side,
  width,
  className,
  children,
}: OverlayPanelProps) {
  return (
    <aside
      style={{ width: width ?? (side === 'right' ? 380 : 232) }}
      className={cn(
        'pointer-events-auto absolute top-0 bottom-0 flex flex-col',
        'border-line bg-base/95 backdrop-blur-sm',
        SIDE_CLASS[side],
        className,
      )}
    >
      {children}
    </aside>
  )
}
