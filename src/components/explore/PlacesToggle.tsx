'use client'

import { cn } from '@/lib/utils/cn'

interface PlacesToggleProps {
  open: boolean
  /** Quantos lugares o recorte tem agora. */
  count: number
  onToggle: () => void
}

/**
 * A porta da trilha de lugares.
 *
 * A trilha deixou de nascer aberta para o mapa poder ser o que o ADR 0010 diz
 * que ele é — estrutura, e não o buraco entre painéis. Mas ela é o único
 * caminho de TECLADO até um lugar, e a única leitura de "o que está no recorte"
 * quando os pins se sobrepõem em zoom baixo. Escondê-la sem lhe dar uma porta
 * alcançável seria trocar acessibilidade por limpeza visual.
 *
 * É a mesma cápsula da chave de postos, no mesmo canto e do mesmo material — as
 * duas são controles de mapa, e duas peças de cromo com a mesma função não
 * podem ter materiais diferentes.
 */
export function PlacesToggle({ open, count, onToggle }: PlacesToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      className={cn(
        'chrome-capsule chrome-press press pointer-events-auto',
        // Sem posição própria: mora na fileira de controles de mapa que
        // `ExploreView` posiciona. Ver `FuelToggle`.
        // 44px: piso de alvo do produto inteiro, e este é apertado de luva.
        'flex h-11 items-center gap-2.5 rounded-full px-4 whitespace-nowrap',
        'text-small font-medium',
        open ? 'text-ink' : 'text-ink-muted hover:text-ink',
      )}
    >
      Lugares
      {/* Contagem é dado: mono, como o mostrador e a lista. */}
      <span
        key={count}
        className="value-changed instrument-value text-micro text-ink-faint"
        data-motion="signal"
      >
        {count}
      </span>
    </button>
  )
}
