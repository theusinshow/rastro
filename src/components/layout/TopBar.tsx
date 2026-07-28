'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOutAction } from '@/app/entrar/actions'
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
      className="relative z-30 flex h-12 shrink-0 items-center gap-3
                 border-b border-line bg-base/85 px-3 backdrop-blur-sm
                 md:gap-8 md:px-4"
    >
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 text-[1rem] font-semibold
                   tracking-[0.18em] text-ink uppercase"
      >
        <span aria-hidden className="h-3.5 w-0.5 bg-accent" />
        Rastro
      </Link>

      {/* Abaixo de 768px os quatro destinos não cabem ao lado da marca. Rolar
          na horizontal mantém todos alcançáveis; cortar "Memórias" não. */}
      <nav
        aria-label="Navegação principal"
        className="min-w-0 overflow-x-auto [scrollbar-width:none]"
      >
        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block px-2 py-2.5 text-[0.9375rem] whitespace-nowrap uppercase',
                    'tracking-[0.12em] transition-colors md:px-3',
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

      {/* Texto, não ícone: o produto não tem conjunto de ícones e é melhor por
          isso. Peso terciário — nenhuma das duas é ação que se procura o tempo
          todo, e ambas competiriam com a navegação se tivessem mais peso. */}
      <Link
        href="/lugar/novo"
        className="ml-auto shrink-0 px-2 py-2.5 text-[0.9375rem] tracking-[0.12em]
                   whitespace-nowrap text-ink-faint uppercase transition-colors
                   hover:text-ink-muted"
      >
        Novo lugar
      </Link>

      <form action={signOutAction} className="shrink-0">
        <button
          type="submit"
          className="px-2 py-2.5 text-[0.9375rem] tracking-[0.12em] whitespace-nowrap
                     text-ink-faint uppercase transition-colors hover:text-ink-muted"
        >
          Sair
        </button>
      </form>
    </header>
  )
}
