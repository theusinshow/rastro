import { DEFAULT_ORIGIN_LABEL } from '@/mocks/user'

export function StatusBar() {
  return (
    <footer
      className="relative z-20 flex h-7 shrink-0 items-center gap-6
                 border-t border-line bg-base px-4"
    >
      <span className="instrument-value text-[10px] text-ink-faint">
        ⌖ —.———— —.————
      </span>
      <span className="instrument-value text-[10px] text-ink-faint">Z—</span>
      <span className="ml-auto instrument-value text-[10px] text-ink-faint">
        ⌂ {DEFAULT_ORIGIN_LABEL}
      </span>
    </footer>
  )
}
