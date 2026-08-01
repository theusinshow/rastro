'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOutAction } from '@/app/entrar/actions'
import { Logo } from '@/components/ui/Logo'
import { cn } from '@/lib/utils/cn'
import { NavIcon } from './nav-icons'
import { NAV_ITEMS, isActive } from './nav-items'
import { ThemeToggle } from './ThemeToggle'
import { useViewer } from './viewer-context'

export function TopBar() {
  const pathname = usePathname()
  const { isGuest } = useViewer()

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
      // `pointer-events-auto`: o contêiner do cromo é transparente ao ponteiro
      // para o mapa receber roda e arrasto, e a barra reativa o que é seu.
      //
      // Uma linha em toda largura. Era uma grade de duas linhas abaixo de 768px
      // para caber a navegação; com os destinos na barra inferior do celular,
      // sobra marca e ações, que cabem lado a lado em 366px.
      className="chrome-capsule pointer-events-auto absolute inset-x-(--chrome-gap) top-(--chrome-gap)
                 z-(--z-bar) flex h-(--bar-height) items-stretch gap-2
                 rounded-full px-3 md:gap-5 md:px-4"
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

      {/* Só a partir de 768px. No celular os mesmos quatro destinos moram na
          barra inferior, ao alcance do polegar — ver `BottomNav`. Aqui não é
          `hidden md:block` num contêiner: o `<nav>` inteiro sai do documento,
          para não haver duas regiões de navegação na árvore de acessibilidade
          anunciando o mesmo. */}
      <nav
        aria-label="Navegação principal"
        className="hidden min-w-0 self-stretch md:block"
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
                      // Duas tintas, e não uma: o PREENCHIMENTO do destino ativo
                      // é o mesmo de dia e de noite — é o que faz a cor virar
                      // identificador. Já o glifo do inativo precisa de razão
                      // sobre a superfície, e no claro os quatro matizes do
                      // escuro não têm.
                      '--tint': `var(--color-${item.tint})`,
                      '--tint-ink': `var(--color-${item.tint}-ink)`,
                    } as React.CSSProperties
                  }
                  className={cn(
                    'press flex whitespace-nowrap rounded-full',
                    // Glifo e rótulo lado a lado: só existe a partir de 768px,
                    // onde há largura para isso. O empilhamento que resolvia o
                    // aperto do celular mudou de endereço junto com a navegação,
                    // e agora vive no `BottomNav`.
                    'h-10 flex-row items-center justify-center gap-2 px-3.5',
                    'text-small',
                    active
                      ? // Preenchido na cor do destino, com um brilho curto da
                        // própria cor. O rótulo vira a tinta escura porque o
                        // preenchimento é claro: 8.60 / 6.52 / 7.21 / 7.70.
                        'bg-(--tint) font-bold text-on-accent shadow-[0_12px_22px_-14px_var(--tint)]'
                      : // Inativo é uma tecla: superfície elevada e o glifo na
                        // cor do destino. **O rótulo nunca é colorido** —
                        // colorir a palavra faria quatro cores competirem por
                        // atenção ao mesmo tempo, e nenhuma seria estado.
                        'bg-raised text-ink-muted hover:bg-overlay hover:text-ink [&>svg]:text-(--tint-ink)',
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
      <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
        <Link
          href="/lugar/novo"
          // h-11 e não h-10: 44px é o piso de alvo, e este produto é usado
          // parado no acostamento, com luva.
          className="press flex h-11 items-center gap-1.5 rounded-full
                     bg-accent-fill px-4 text-small font-bold whitespace-nowrap
                     text-on-accent hover:bg-accent-fill-strong"
        >
          <span aria-hidden className="text-lead leading-none">
            +
          </span>
          <span className="hidden sm:inline">Novo lugar</span>
          <span className="sr-only sm:hidden">Novo lugar</span>
        </Link>

        <ThemeToggle />

        {/* O estado de visitante mora aqui porque é aqui que a identidade já
            mora — não é selo na navegação nem faixa no topo, e nenhum dos dois
            caberia sem roubar altura do mapa, que o ADR 0010 trata como escasso.

            Abaixo de 640px o rótulo some e sobra o botão: a palavra "Entrar"
            ali já denuncia que não há conta, e a barra não tem largura para os
            dois. Ver ADR 0017. */}
        {isGuest ? (
          <span className="instrument-label hidden text-ink-faint sm:inline">
            Visitante
          </span>
        ) : null}

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
            {/* Para um visitante, sair e entrar são o mesmo gesto: a ação
                encerra a sessão e cai em `/entrar`, que é exatamente o destino
                prometido. Nomear o destino vale mais que nomear a porta. */}
            {isGuest ? (
              <>
                <span className="sm:hidden">Entrar</span>
                <span className="hidden sm:inline">Entrar com conta</span>
              </>
            ) : (
              'Sair'
            )}
          </button>
        </form>
      </div>
    </header>
  )
}
