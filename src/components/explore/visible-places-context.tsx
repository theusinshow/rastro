'use client'

import { createContext, useContext, useMemo, useState } from 'react'

interface VisiblePlacesValue {
  count: number | null
  setCount: (count: number | null) => void
}

const VisiblePlacesContext = createContext<VisiblePlacesValue | null>(null)

// A statusbar mora no layout e a contagem nasce na página do Explore. Este
// contexto é a ponte entre as duas, e existe só para isso.
export function VisiblePlacesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [count, setCount] = useState<number | null>(null)
  const value = useMemo(() => ({ count, setCount }), [count])

  return (
    <VisiblePlacesContext.Provider value={value}>
      {children}
    </VisiblePlacesContext.Provider>
  )
}

/** `null` quando a rota atual não lista lugares. */
export function useVisiblePlaceCount(): number | null {
  return useContext(VisiblePlacesContext)?.count ?? null
}

export function useSetVisiblePlaceCount(): (count: number | null) => void {
  const context = useContext(VisiblePlacesContext)
  return context ? context.setCount : () => {}
}
