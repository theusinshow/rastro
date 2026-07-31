'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOutAction } from '@/app/entrar/actions'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils/cn'
import { NavIcon, type NavIconName } from './nav-icons'

/**
 * Uma cor por destino, e a MESMA cor sempre.
 *
 * É o que faz a cor virar identificador de lugar na aplicação em vez de
 * enfeite: quem chega em Viagens reconhece o oliva antes de ler a palavra. Os
 * quatro matizes são vizinhos e têm a mesma leveza — nenhum azul de SaaS.
 */
const NAV_ITEMS = [
  { href: '/', label: 'Explorar', icon: 'explorar', tint: 'nav-explorar' },
  {
    href: '/descobrir',
    label: 'Descobrir',
    icon: 'descobrir',
    tint: 'nav-descobrir',
  },
  { href: '/viagens', label: 'Viagens', icon: 'viagens', tint: 'nav-viagens' },
  {
    href: '/memorias',
    label: 'Memórias',
    icon: 'memorias',
    tint: 'nav-memorias',
  },
] as const satisfies ReadonlyArray<{
  href: string
  label: string
  icon: NavIconName
  tint: string
}>

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function TopBar() {
  const pathname = usePathname()

  return (
    /*
     * Cápsula flutuante sobre o mapa. Ver ADR 0010 e ADR 0016.
     *
     * O relevo vem de `.chrome-capsule`: quatro camadas e nenhum gradiente — luz
     * em cima, espessura embaixo, aresta de 3px, e as sombras do sistema. O
     * `backdrop-filter` fica em todas as telas, e não só onde há mapa atrás:
     * cromo que muda de material ao trocar de destino deixa de ser a mesma peça.
     */
    <header
      className="chrome-capsule absolute inset-x-(--chrome-gap) top-(--chrome-gap)
                 z-(--z-bar) grid h-(--bar-height) grid-cols-[auto_1fr]
                 grid-rows-[auto_1fr] items-center gap-x-2 rounded-full px-3
                 md:flex md:items-stretch md:gap-5 md:px-4"
    >
      <Link
        href="/"
        aria-label="Rastro — ir para o mapa"
        // `h-11 min-w-11` no celular: abaixo de 640px a palavra some e sobra o
        // desenho de 26px. Alvo tem duas dimensões, e a marca é o caminho de
        // volta ao mapa — o alvo mais errado de se perder.
        className="type-wordmark flex h-11 min-w-11 shrink-0 items-center
                   justify-center gap-2 text-body text-ink
                   md:h-auto md:min-w-0 md:justify-start"
      >
        <Logo size={26} />
        <span className="hidden sm:inline">Rastro</span>
      </Link>

      {/* Separa a marca da navegação: sem ele "Rastro" lê como o primeiro item
          do menu. Só no desktop — no celular a navegação já está em outra
          linha e o traço não separaria nada. */}
      <span
        aria-hidden
        className="hidden h-6.5 w-px shrink-0 self-center bg-line-strong md:block"
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
                  style={
                    {
                      '--tint': `var(--color-${item.tint})`,
                    } as React.CSSProperties
                  }
                  className={cn(
                    'press flex whitespace-nowrap rounded-full',
                    // No celular o rótulo desce para baixo do glifo. Lado a
                    // lado, os quatro destinos somam 442px numa barra de 340 —
                    // medido, "Memórias" ficava fora da tela. Empilhado, cada
                    // item cabe em ~78px e os quatro entram sem rolagem.
                    'h-14 flex-col items-center justify-center gap-1 px-2.5',
                    'text-micro md:h-10 md:flex-row md:gap-2 md:px-3.5 md:text-small',
                    active
                      ? // Preenchido na cor do destino, com um brilho curto da
                        // própria cor. O rótulo vira a tinta escura porque o
                        // preenchimento é claro: 8.60 / 6.52 / 7.21 / 7.70.
                        'bg-(--tint) font-bold text-on-accent shadow-[0_12px_22px_-14px_var(--tint)]'
                      : // Inativo é uma tecla: superfície elevada e o glifo na
                        // cor do destino. **O rótulo nunca é colorido** —
                        // colorir a palavra faria quatro cores competirem por
                        // atenção ao mesmo tempo, e nenhuma seria estado.
                        'bg-raised text-ink-muted hover:bg-overlay hover:text-ink [&>svg]:text-(--tint)',
                  )}
                >
                  <NavIcon name={item.icon} drawing={active} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Criar lugar é AÇÃO, não destino: sai da gramática da navegação e é o
          único bloco de âmbar cheio da barra. */}
      <div
        className="col-start-2 row-start-1 ml-auto flex shrink-0 items-center
                   gap-2 md:col-start-auto md:row-start-auto md:gap-3"
      >
        <Link
          href="/lugar/novo"
          // h-11 e não h-10: 44px é o piso de alvo, e este produto é usado
          // parado no acostamento, com luva.
          className="press flex h-11 items-center gap-1.5 rounded-full bg-accent
                     px-4 text-small font-bold whitespace-nowrap text-on-accent
                     hover:bg-accent-strong"
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
            className="press flex h-11 items-center rounded-full px-3 text-small
                       whitespace-nowrap text-ink-faint hover:bg-overlay
                       hover:text-ink-muted md:h-10"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  )
}
