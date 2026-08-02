'use client'

import { cn } from '@/lib/utils/cn'

interface FuelToggleProps {
  active: boolean
  /** Quantos postos a última busca trouxe. `null` enquanto não há resposta. */
  count: number | null
  busy: boolean
  onToggle: () => void
}

/**
 * A chave da camada de postos, no canto livre do mapa.
 *
 * Fica no alto à esquerda da **área de mapa** — depois da trilha quando ela
 * está aberta, e encostada na borda quando não está — porque é um controle de
 * mapa, e não de catálogo: ligar postos não filtra lugar nenhum. Abaixo de
 * 768px a trilha vira folha inferior e o alto fica todo livre, então o mesmo
 * canto serve nos dois tamanhos.
 *
 * É uma cápsula do mesmo material das barras (`.chrome-capsule`), e afunda ao
 * ser apertada em vez de encolher — cápsula que encolhe lê como erro de layout.
 *
 * **O rótulo é a palavra, sempre.** O estado ligado não é comunicado por um
 * glifo: é o preenchimento âmbar mais a contagem, e a evidência final são os
 * losangos no mapa.
 */
export function FuelToggle({
  active,
  count,
  busy,
  onToggle,
}: FuelToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        'chrome-capsule chrome-press press pointer-events-auto',
        // **Sem posição própria.** Ela e a porta da trilha moram lado a lado
        // numa mesma fileira em `ExploreView`, que é quem sabe desviar da
        // trilha quando ela abre. Enquanto cada uma se posicionava sozinha, as
        // duas nasciam no mesmo canto e uma desenhava por cima da outra.
        // 44px: piso de alvo do produto inteiro, e este é apertado de luva.
        'flex h-11 items-center gap-2.5 rounded-full px-4 whitespace-nowrap',
        'text-small font-medium',
        // A utilitária vence `.chrome-capsule` sem truque de especificidade: no
        // Tailwind v4 a camada `utilities` vem depois de `components`.
        active
          ? 'bg-accent-fill text-on-accent'
          : 'text-ink-muted hover:text-ink',
      )}
    >
      Postos
      {/*
        A contagem é DADO, e por isso é mono — a mesma regra do mostrador e da
        lista. Some enquanto não há resposta: um zero antes de perguntar seria
        afirmar que não há posto nenhum.
      */}
      {busy ? (
        <span className="instrument-label" aria-live="polite">
          buscando
        </span>
      ) : count !== null ? (
        <span
          key={count}
          className={cn(
            'value-changed instrument-value text-micro',
            active ? 'text-on-accent' : 'text-ink-faint',
          )}
          data-motion="signal"
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}
