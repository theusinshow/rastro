'use client'

import { useEffect, useState } from 'react'
import { useReducedMotion } from './use-reduced-motion'

/**
 * Tempo que o nó fica montado depois de o valor virar `null`.
 *
 * Espelha `calc(var(--dur-base) * 0.7)` de `.overlay-panel[data-exiting]` em
 * `globals.css`, com uma folga de alguns milissegundos para que o desmonte
 * nunca corte o último quadro da transição.
 */
const EXIT_MS = 170

interface ExitState<T> {
  rendered: T | null
  exiting: boolean
}

/**
 * Mantém o conteúdo montado enquanto a animação de saída roda.
 *
 * React desmonta no mesmo quadro em que a condição vira falsa, e um painel que
 * desaparece entre um frame e outro não diz se fechou, se navegou ou se algo
 * quebrou. Este hook devolve o último valor não nulo durante a saída, para que
 * o painel não pisque vazio antes de sumir.
 *
 * Sob `prefers-reduced-motion` não há saída para esperar: o desmonte é imediato.
 */
export function useExitTransition<T>(value: T | null): ExitState<T> {
  const reducedMotion = useReducedMotion()
  const [state, setState] = useState<ExitState<T>>({
    rendered: value,
    exiting: false,
  })

  // Ajuste durante o render, e não num efeito: derivar de prop com `useEffect`
  // custaria um quadro a mais, e é justamente no primeiro quadro que a entrada
  // do painel precisa acontecer.
  if (value !== null) {
    if (state.rendered !== value || state.exiting) {
      setState({ rendered: value, exiting: false })
    }
  } else if (state.rendered !== null && !state.exiting) {
    setState(
      reducedMotion
        ? { rendered: null, exiting: false }
        : { rendered: state.rendered, exiting: true },
    )
  }

  useEffect(() => {
    if (!state.exiting) return
    const timer = window.setTimeout(
      () => setState({ rendered: null, exiting: false }),
      EXIT_MS,
    )
    return () => window.clearTimeout(timer)
  }, [state.exiting])

  return state
}
