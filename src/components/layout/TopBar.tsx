'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { href: '/', label: 'Explorar' },
  { href: '/descobrir', label: 'Descobrir' },
  { href: '/viagens', label: 'Viagens' },
  { href: '/memorias', label: 'Memórias' },
] as const

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function TopBar() {
  const pathname = usePathname()

  return (
    <header
      className="relative z-20 flex h-12 shrink-0 items-center gap-8
                 border-b border-line bg-base/85 px-4 backdrop-blur-sm"
    >
      <Link
        href="/"
        className="flex items-center gap-2 text-sm font-semibold
                   tracking-[0.18em] text-ink uppercase"
      >
        <span aria-hidden className="h-3.5 w-0.5 bg-accent" />
        Rastro
      </Link>

      <nav aria-label="Navegação principal">
        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block px-3 py-1.5 text-[11px] uppercase tracking-[0.12em]',
                    'transition-colors',
                    active
                      ? 'text-accent'
                      : 'text-ink-faint hover:text-ink-muted',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
