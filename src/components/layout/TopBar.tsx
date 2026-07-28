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

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function TopBar() {
  const pathname = usePathname()

  return (
    <header
      className="relative z-30 flex h-14 shrink-0 items-stretch gap-2
                 border-b border-line bg-base/85 px-3 backdrop-blur-sm
                 md:gap-6 md:px-4"
    >
      <Link
        href="/"
        aria-label="Rastro — ir para o mapa"
        className="flex shrink-0 items-center gap-2 text-body font-semibold
                   tracking-[0.18em] text-ink uppercase"
      >
        <Logo size={24} />
        <span className="hidden sm:inline">Rastro</span>
      </Link>

      {/* Abaixo de 768px os quatro destinos não cabem ao lado da marca. Rolar
          na horizontal mantém todos alcançáveis; cortar "Memórias" não. */}
      <nav
        aria-label="Navegação principal"
        className="min-w-0 overflow-x-auto [scrollbar-width:none]"
      >
        <ul className="flex h-full items-stretch gap-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <li key={item.href} className="flex">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    // A âncora ocupa a altura inteira da barra para que o traço
                    // de ativo assente na borda inferior, e não flutue.
                    'relative flex items-center px-2.5 text-small whitespace-nowrap',
                    'uppercase tracking-[0.12em] transition-colors md:px-3',
                    // O traço é o que faz a posição atual sobreviver a quem não
                    // distingue o âmbar do cinza. Cor sozinha não basta.
                    'after:absolute after:inset-x-1 after:bottom-0 after:h-0.5',
                    "after:rounded-full after:content-['']",
                    active
                      ? 'text-accent after:bg-accent'
                      : 'text-ink-faint after:bg-transparent hover:text-ink-muted',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Criar lugar é AÇÃO, não destino: sai da gramática da navegação e ganha
          contorno. Estava com o mesmo peso terciário de "Sair", e as duas
          ficavam coladas — errar o alvo custava a sessão. */}
      <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
        <Link
          href="/lugar/novo"
          className="press flex h-9 items-center gap-2 rounded-sm border
                     border-line-strong px-3 text-small whitespace-nowrap
                     text-ink uppercase tracking-widest hover:border-accent
                     hover:text-accent"
        >
          <span aria-hidden className="text-lead leading-none">
            +
          </span>
          <span className="hidden sm:inline">Novo lugar</span>
          <span className="sr-only sm:hidden">Novo lugar</span>
        </Link>

        {/* Hairline separando a saída do resto. Sair não é navegação: é o fim
            da sessão, e não deve morar encostado no que se clica sempre. */}
        <span aria-hidden className="h-5 w-px bg-line-strong" />

        <form action={signOutAction} className="flex">
          <button
            type="submit"
            className="press rounded-sm px-2 py-2 text-small tracking-[0.12em]
                       whitespace-nowrap text-ink-faint uppercase
                       hover:bg-overlay hover:text-ink-muted"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  )
}
