'use client'

import { formatCoordinate } from '@/domain/geo'
import { useMapView } from '@/components/map/map-context'
import { DEFAULT_ORIGIN_LABEL } from '@/mocks/user'

export function StatusBar() {
  const view = useMapView()

  return (
    <footer
      className="relative z-20 flex h-7 shrink-0 items-center gap-6
                 border-t border-line bg-base px-4"
    >
      <span className="instrument-value text-[10px] text-ink-faint">
        {'⌖ '}
        {view
          ? `${formatCoordinate(view.center.latitude)} ${formatCoordinate(view.center.longitude)}`
          : '—.———— —.————'}
      </span>
      <span className="instrument-value text-[10px] text-ink-faint">
        Z{view ? view.zoom.toFixed(1) : '—'}
      </span>
      <span className="ml-auto instrument-value text-[10px] text-ink-faint">
        ⌂ {DEFAULT_ORIGIN_LABEL}
      </span>
    </footer>
  )
}
