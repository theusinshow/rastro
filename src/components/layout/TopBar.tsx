'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOutAction } from '@/app/entrar/actions'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { href: '/', label: 'Explorar' },
  { href: '/descobrir', label: 'Descobrir' },
  { href: '/viagens', label: 'Viagens' },
  { href: '/memorias', label: 'Memórias' },
] as const

/** Ação terciária da barra: "Novo lugar" e "Sair" são o mesmo controle. */
const BAR_ACTION =
  'press rounded-sm px-2 py-2.5 text-small tracking-[0.12em] whitespace-nowrap ' +
  'text-ink-faint uppercase hover:bg-overlay hover:text-ink-muted'

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
        className="flex shrink-0 items-center gap-2 text-body font-semibold
                   tracking-[0.18em] text-ink uppercase"
      >
        <Logo size={26} />
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
                    'block px-2 py-2.5 text-small whitespace-nowrap uppercase',
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
          todo, e ambas competiriam com a navegação se tivessem mais peso.

          A classe é compartilhada porque as duas SÃO o mesmo controle; uma é
          link e a outra precisa ser `submit` de um formulário de Server Action,
          e essa é a única diferença. */}
      <Link href="/lugar/novo" className={cn(BAR_ACTION, 'ml-auto shrink-0')}>
        Novo lugar
      </Link>

      <form action={signOutAction} className="shrink-0">
        <button type="submit" className={BAR_ACTION}>
          Sair
        </button>
      </form>
    </header>
  )
}
