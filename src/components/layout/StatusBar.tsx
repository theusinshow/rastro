'use client'

import { formatCoordinate } from '@/domain/geo'
import { useVisiblePlaceCount } from '@/components/explore/visible-places-context'
import { useMapView } from '@/components/map/map-context'
import { usePickerState } from '@/components/map/picker-context'
import { cn } from '@/lib/utils/cn'
import { useOrigin } from './origin-context'

export function StatusBar() {
  const view = useMapView()
  const count = useVisiblePlaceCount()
  const { label: originLabel } = useOrigin()
  const { active: picking, cursor } = usePickerState()

  // Durante a mira, a coordenada deixa de ser mostrador e vira instrumento: o
  // número que se lê é exatamente o que vai ser gravado.
  const shown = picking ? cursor : (view?.center ?? null)

  return (
    <footer
      className="relative z-30 flex h-9 shrink-0 items-center gap-3
                 overflow-hidden border-t border-line bg-base px-4 md:gap-6"
    >
      <span
        className={cn(
          'instrument-value text-[0.75rem] whitespace-nowrap',
          picking ? 'text-accent' : 'text-ink-faint',
        )}
      >
        {picking ? 'MIRA ' : '⌖ '}
        {shown
          ? `${formatCoordinate(shown.latitude)} ${formatCoordinate(shown.longitude)}`
          : '—.———— —.————'}
      </span>
      {/* Abaixo de 768px a barra tem 36px de altura fixa e quatro campos a fazem
          quebrar em duas linhas. Coordenada e contagem ficam; zoom e origem são
          os dois que menos mudam durante o uso. */}
      <span className="instrument-value hidden text-[0.75rem] text-ink-faint md:inline">
        Z{view ? view.zoom.toFixed(1) : '—'}
      </span>
      {count !== null ? (
        <span
          // `key` remonta o nó e reinicia o realce a cada valor novo. Sem ele o
          // número muda a 10px num canto e ninguém percebe.
          key={count}
          className="value-changed instrument-value px-1 text-[0.75rem]
                     whitespace-nowrap text-ink-faint"
        >
          ● {count} {count === 1 ? 'lugar' : 'lugares'}
        </span>
      ) : null}
      {/* Sem origem definida o campo some, em vez de mostrar um lugar que não é
          o seu. É o mesmo princípio do resto: não inventar dado. */}
      {originLabel ? (
        <span className="ml-auto instrument-value hidden text-[0.75rem] text-ink-faint md:inline">
          ⌂ {originLabel}
        </span>
      ) : null}
    </footer>
  )
}
