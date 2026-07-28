import type { VisitStatus } from '@/domain/place'
import { cn } from '@/lib/utils/cn'

const STATUS_LABEL: Record<VisitStatus, string> = {
  visitado: 'Visitado',
  'quero-conhecer': 'Quero conhecer',
  'nao-visitado': 'Não visitado',
}

// Mesmas cores dos pins, para que painel e mapa contem a mesma história.
const STATUS_CLASS: Record<VisitStatus, string> = {
  visitado: 'text-visited before:bg-visited',
  'quero-conhecer': 'text-wanted before:bg-wanted',
  'nao-visitado': 'text-ink-faint before:bg-unvisited',
}

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-micro uppercase',
        'tracking-[0.14em] before:h-1.5 before:w-1.5 before:rounded-full',
        'before:content-[""]',
        STATUS_CLASS[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
