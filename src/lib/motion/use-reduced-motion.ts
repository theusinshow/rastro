'use client'

import { useSyncExternalStore } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  return window.matchMedia(QUERY).matches
}

/** No servidor não existe `matchMedia`; a preferência é lida na hidratação. */
function getServerSnapshot(): boolean {
  return false
}

/**
 * Preferência de movimento reduzido do sistema.
 *
 * O CSS resolve sozinho o que é declarativo — ver o bloco
 * `@media (prefers-reduced-motion: reduce)` em `globals.css`. Este hook existe
 * só para as decisões que acontecem em JavaScript: o crescimento dos anéis
 * pintados pelo MapLibre e o tempo que um painel fica montado durante a saída.
 */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
