import type { MapTheme } from './map/palette'

/**
 * O tema, na fronteira entre servidor e cliente.
 *
 * Este arquivo **não** é `'use client'`, e é isso que ele existe para ser: o
 * `layout` lê o cookie no servidor e o provedor o escreve no navegador, então as
 * constantes e a validação precisam ser chamáveis dos dois lados. Elas moravam
 * dentro do provedor, e o `layout` quebrava com *"Attempted to call isTheme()
 * from the server but isTheme is on the client"* — uma tela de erro inteira, não
 * um aviso.
 */
export const THEME_COOKIE = 'rastro-tema'

export const DEFAULT_THEME: MapTheme = 'escuro'

/** Um ano: a escolha de tema não é sessão, é preferência. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export function isTheme(value: unknown): value is MapTheme {
  return value === 'escuro' || value === 'claro'
}

export type { MapTheme }
