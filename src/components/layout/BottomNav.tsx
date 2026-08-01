'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { NavIcon } from './nav-icons'
import { NAV_ITEMS, isActive } from './nav-items'

/**
 * A navegação do celular, onde o polegar alcança.
 *
 * **Por que ela existe.** No desktop os quatro destinos moram na barra do topo,
 * e está certo: lá quem navega é um cursor, e a distância não custa nada. No
 * celular o mesmo desenho punha os quatro em `y ≈ 58–114` de uma tela de 844px
 * — medido —, que é o canto mais longe do polegar de quem segura o aparelho com
 * uma mão. E cobrava 104px de altura por isso, porque não cabiam numa linha só
 * junto da marca e das ações.
 *
 * O roteiro registrava o sintoma errado: dizia que a barra "rola na horizontal".
 * Isso já tinha sido resolvido pelo empilhamento glifo/rótulo — os quatro cabem
 * em 340px. O que sobrou foi alcance, e alcance não se resolve rolando.
 *
 * **O que ela não muda.** Os mesmos quatro destinos, os mesmos glifos, a mesma
 * cor por destino, o mesmo rótulo sempre ao lado do glifo (ADR 0011). O
 * material é o `chrome-capsule` das outras barras — cromo que muda de material
 * ao trocar de lugar deixa de ser a mesma peça.
 *
 * **`env(safe-area-inset-bottom)`** entra na altura porque o iPhone reserva a
 * faixa do indicador de gesto: sem isso os quatro alvos ficam parcialmente sob
 * ela, e o alvo de 44px vira 44px menos o que o sistema comeu.
 */
export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navegação principal"
      className="chrome-capsule pointer-events-auto absolute inset-x-(--chrome-gap)
                 bottom-(--chrome-gap) z-(--z-bar) flex h-(--nav-height)
                 items-stretch gap-1 rounded-full px-1.5 pb-(--safe-bottom)
                 md:hidden"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            style={
              {
                // Duas tintas, e não uma: o PREENCHIMENTO do destino ativo é o
                // mesmo de dia e de noite — é o que faz a cor virar
                // identificador. Já o glifo do inativo precisa de razão sobre a
                // superfície, e no claro os quatro matizes do escuro não têm.
                '--tint': `var(--color-${item.tint})`,
                '--tint-ink': `var(--color-${item.tint}-ink)`,
              } as React.CSSProperties
            }
            className={cn(
              'press flex flex-1 flex-col items-center justify-center gap-1',
              // Cada destino ocupa um quarto da largura: em 390px são ~91px de
              // alvo, contra os 63–73px de antes. Alvo tem duas dimensões.
              'min-w-0 rounded-full text-micro',
              active
                ? // Preenchido na cor do destino, com um brilho curto da própria
                  // cor. O rótulo vira a tinta escura porque o preenchimento é
                  // claro: 8.60 / 6.52 / 7.21 / 7.70.
                  'bg-(--tint) font-bold text-on-accent shadow-[0_12px_22px_-14px_var(--tint)]'
                : // **O rótulo nunca é colorido** — colorir a palavra faria
                  // quatro cores competirem por atenção ao mesmo tempo, e
                  // nenhuma seria estado.
                  'text-ink-muted [&>svg]:text-(--tint-ink)',
            )}
          >
            <NavIcon name={item.icon} drawing={active} />
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
