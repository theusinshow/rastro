'use client'

import { createContext, useContext, useMemo } from 'react'
import type { Coordinates } from '@/domain/geo'

interface OriginValue {
  origin: Coordinates | null
  label: string | null
}

const OriginContext = createContext<OriginValue>({ origin: null, label: null })

/**
 * Origem do usuário, lida do perfil no servidor e distribuída à árvore de
 * cliente.
 *
 * Antes disto a origem era uma constante importada por cinco componentes, o que
 * significava que tornar a origem por usuário exigiria tocar em cada um deles a
 * cada mudança. Um contexto centraliza a decisão num lugar.
 */
export function OriginProvider({
  origin,
  label,
  children,
}: OriginValue & { children: React.ReactNode }) {
  const value = useMemo(() => ({ origin, label }), [origin, label])
  return <OriginContext.Provider value={value}>{children}</OriginContext.Provider>
}

/** `origin` é `null` enquanto o usuário não escolheu a dele. */
export function useOrigin(): OriginValue {
  return useContext(OriginContext)
}
