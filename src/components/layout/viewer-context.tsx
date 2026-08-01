'use client'

import { createContext, useContext, useMemo } from 'react'
import type { Viewer } from '@/domain/guest'

/**
 * O padrão é "tem conta", e não "é visitante".
 *
 * O erro possível nesta direção é oferecer o envio de foto a um visitante — que
 * o banco recusa de qualquer forma (migration 0008), com o motivo dito. O erro
 * oposto seria esconder o envio de quem tem conta: um recurso que some sem
 * explicação, e sem nada no banco para contradizer. Entre um erro que o banco
 * corrige e um que ninguém percebe, o padrão fica no primeiro.
 */
const ViewerContext = createContext<Viewer>({ isGuest: false })

/**
 * Quem está olhando, lido da sessão no servidor e distribuído à árvore de
 * cliente. Mesmo padrão do `OriginProvider`, e pelo mesmo motivo: a TopBar e o
 * painel de fotos são componentes de cliente e não leem sessão sozinhos.
 */
export function ViewerProvider({
  viewer,
  children,
}: {
  viewer: Viewer
  children: React.ReactNode
}) {
  const value = useMemo(() => ({ isGuest: viewer.isGuest }), [viewer.isGuest])
  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>
}

export function useViewer(): Viewer {
  return useContext(ViewerContext)
}
