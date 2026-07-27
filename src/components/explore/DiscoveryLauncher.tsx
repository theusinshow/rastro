import Link from 'next/link'

export function DiscoveryLauncher() {
  return (
    <Link
      href="/descobrir"
      className="pointer-events-auto absolute bottom-5 left-1/2 flex
                 -translate-x-1/2 items-center gap-3 border border-accent
                 bg-accent px-5 py-2.5 text-[11px] font-semibold
                 tracking-[0.16em] text-void uppercase transition-opacity
                 hover:opacity-90"
    >
      Para onde vamos?
      <span aria-hidden>→</span>
    </Link>
  )
}
