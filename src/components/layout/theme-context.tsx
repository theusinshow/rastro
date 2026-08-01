'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import {
  DEFAULT_THEME,
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
  type MapTheme,
} from '@/lib/theme'

interface ThemeState {
  theme: MapTheme
  toggle: () => void
}

const Context = createContext<ThemeState | null>(null)

export function ThemeProvider({
  initial,
  children,
}: {
  initial: MapTheme
  children: React.ReactNode
}) {
  const [theme, setTheme] = useState<MapTheme>(initial)

  const toggle = useCallback(() => {
    setTheme((atual) => {
      const proximo: MapTheme = atual === 'escuro' ? 'claro' : 'escuro'

      // O atributo é escrito ANTES do cookie, e sem esperar o servidor: trocar
      // de tema é feedback de toque, não navegação. O cookie existe só para a
      // próxima carga já vir certa, sem um quadro no tema errado.
      document.documentElement.dataset.theme = proximo
      document.cookie = `${THEME_COOKIE}=${proximo}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`

      return proximo
    })
  }, [])

  return (
    <Context.Provider value={{ theme, toggle }}>{children}</Context.Provider>
  )
}

/**
 * `escuro` fora do provedor, e não erro.
 *
 * O mapa da tela de entrada monta sem o cromo da aplicação, e ele precisa de uma
 * paleta para desenhar. Falhar ali trocaria um tema errado por uma tela branca.
 */
export function useTheme(): ThemeState {
  return useContext(Context) ?? { theme: DEFAULT_THEME, toggle: () => {} }
}
