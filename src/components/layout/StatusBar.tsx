'use client'

import { formatCoordinate } from '@/domain/geo'
import { useVisiblePlaceCount } from '@/components/explore/visible-places-context'
import { useMapView } from '@/components/map/map-context'
import { DEFAULT_ORIGIN_LABEL } from '@/mocks/user'

export function StatusBar() {
  const view = useMapView()
  const count = useVisiblePlaceCount()

  return (
    <footer
      className="relative z-30 flex h-7 shrink-0 items-center gap-3
                 overflow-hidden border-t border-line bg-base px-4 md:gap-6"
    >
      <span className="instrument-value whitespace-nowrap text-[10px] text-ink-faint">
        {'⌖ '}
        {view
          ? `${formatCoordinate(view.center.latitude)} ${formatCoordinate(view.center.longitude)}`
          : '—.———— —.————'}
      </span>
      {/* Abaixo de 768px a barra tem 28px de altura fixa e quatro campos a fazem
          quebrar em duas linhas. Coordenada e contagem ficam; zoom e origem são
          os dois que menos mudam durante o uso. */}
      <span className="instrument-value hidden text-[10px] text-ink-faint md:inline">
        Z{view ? view.zoom.toFixed(1) : '—'}
      </span>
      {count !== null ? (
        <span
          // `key` remonta o nó e reinicia o realce a cada valor novo. Sem ele o
          // número muda a 10px num canto e ninguém percebe.
          key={count}
          className="value-changed instrument-value px-1 text-[10px]
                     whitespace-nowrap text-ink-faint"
        >
          ● {count} {count === 1 ? 'lugar' : 'lugares'}
        </span>
      ) : null}
      <span className="ml-auto instrument-value hidden text-[10px] text-ink-faint md:inline">
        ⌂ {DEFAULT_ORIGIN_LABEL}
      </span>
    </footer>
  )
}
