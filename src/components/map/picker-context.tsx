'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { Coordinates } from '@/domain/geo'

interface PickerContextValue {
  active: boolean
  cursor: Coordinates | null
  setActive: (value: boolean) => void
  setCursor: (value: Coordinates | null) => void
}

const PickerContext = createContext<PickerContextValue | null>(null)

/**
 * Estado do modo de escolha de ponto.
 *
 * Vive no layout, e não dentro do componente que escolhe, porque a StatusBar
 * precisa saber que a mira está ativa — e ela é irmã do mapa, não filha do
 * formulário.
 */
export function PickerProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState(false)
  const [cursor, setCursor] = useState<Coordinates | null>(null)

  // Identidade estável nos dois setters: `PointPicker` os usa como dependência
  // de efeito, e um par novo a cada render remontaria o modo de mira.
  const stableSetActive = useCallback((value: boolean) => setActive(value), [])
  const stableSetCursor = useCallback(
    (value: Coordinates | null) => setCursor(value),
    [],
  )

  const value = useMemo(
    () => ({
      active,
      cursor,
      setActive: stableSetActive,
      setCursor: stableSetCursor,
    }),
    [active, cursor, stableSetActive, stableSetCursor],
  )

  return <PickerContext.Provider value={value}>{children}</PickerContext.Provider>
}

function usePickerContext(): PickerContextValue {
  const context = useContext(PickerContext)
  if (!context) {
    throw new Error('os hooks de picker precisam estar dentro de <PickerProvider>')
  }
  return context
}

export function usePickerState() {
  const { active, cursor } = usePickerContext()
  return { active, cursor }
}

export function usePickerControls() {
  const { setActive, setCursor } = usePickerContext()
  return { setActive, setCursor }
}
