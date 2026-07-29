'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOutAction } from '@/app/entrar/actions'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils/cn'
import { NavIcon, type NavIconName } from './nav-icons'

const NAV_ITEMS = [
  { href: '/', label: 'Explorar', icon: 'explorar' },
  { href: '/descobrir', label: 'Descobrir', icon: 'descobrir' },
  { href: '/viagens', label: 'Viagens', icon: 'viagens' },
  { href: '/memorias', label: 'Memórias', icon: 'memorias' },
] as const satisfies ReadonlyArray<{
  href: string
  label: string
  icon: NavIconName
}>

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function TopBar() {
  const pathname = usePathname()

  return (
    /*
     * Barra flutuante sobre o mapa. Ver ADR 0010.
     *
     * O `backdrop-blur` sobre `base/85` é o que mantém o texto legível quando o
     * que passa por baixo é relevo sombreado ou água quase preta. É legibilidade,
     * não efeito — e continua sendo o único uso de blur permitido no produto.
     */
    <header
      className="absolute inset-x-(--chrome-gap) top-(--chrome-gap) z-(--z-bar)
                 grid h-(--bar-height) grid-cols-[auto_1fr] grid-rows-[auto_1fr]
                 items-center gap-x-2 rounded-lg border border-line bg-base/85
                 px-3 backdrop-blur-sm md:flex md:items-stretch md:gap-6 md:px-4"
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

      {/* Separa a marca da navegação: sem ele "Rastro" lê como o primeiro item
          do menu. Só no desktop — no celular a navegação já está em outra
          linha e o traço não separaria nada. */}
      <span
        aria-hidden
        className="hidden h-5 w-px shrink-0 self-center bg-line-strong md:block"
      />

      {/* Abaixo de 768px a navegação desce para a segunda linha da grade e ocupa
          a largura inteira. Espremida ao lado da marca e das ações, ela cortava
          "Descobrir" no meio da palavra. */}
      <nav
        aria-label="Navegação principal"
        className="col-span-2 row-start-2 min-w-0 self-stretch overflow-x-auto
                   scrollbar-none md:col-span-1 md:row-start-auto"
      >
        <ul className="flex h-full items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <li key={item.href} className="flex">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    // `rounded-2xl` no celular: com o rótulo embaixo do glifo o
                    // item fica quase quadrado, e `rounded-full` o transformaria
                    // num círculo. O raio é proporcional ao elemento.
                    'press flex whitespace-nowrap rounded-2xl md:rounded-full',
                    // No celular o rótulo desce para baixo do glifo. Lado a
                    // lado, os quatro destinos somam 442px numa barra de 340 —
                    // medido, "Memórias" ficava fora da tela. Empilhado, cada
                    // item cabe em ~78px e os quatro entram sem rolagem.
                    'h-14 flex-col items-center justify-center gap-1 px-2',
                    'text-micro md:h-10 md:flex-row md:gap-2 md:px-3 md:text-small',
                    // Caixa normal, sem tracking: caixa alta e espaçamento largo
                    // são o vocabulário reservado à medição, e gastá-los aqui
                    // enfraquecia a leitura de instrumento onde ela importa.
                    // Ver ADR 0011.
                    active
                      ? 'bg-accent/14 text-accent'
                      : 'text-ink-muted hover:bg-overlay hover:text-ink',
                  )}
                >
                  <NavIcon name={item.icon} />
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
      <div className="col-start-2 row-start-1 ml-auto flex shrink-0 items-center
                      gap-2 md:col-start-auto md:row-start-auto md:gap-3">
        <Link
          href="/lugar/novo"
          className="press flex h-10 items-center gap-1.5 rounded-full border
                     border-line-strong px-3.5 text-small whitespace-nowrap
                     text-ink hover:border-accent hover:text-accent"
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
            className="press flex h-10 items-center rounded-full px-3 text-small
                       whitespace-nowrap text-ink-faint hover:bg-overlay
                       hover:text-ink-muted"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  )
}
