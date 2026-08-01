'use client'

import { useTheme } from './theme-context'

/**
 * Dia e noite.
 *
 * O glifo **é o próprio estado**, que é a única forma de ícone sem rótulo que o
 * ADR 0016 permite: sol quando está claro, lua quando está escuro. O rótulo
 * acessível diz para onde o botão leva, e não onde se está — é o que um botão
 * promete.
 *
 * O sol e a lua compartilham o mesmo círculo central e trocam só o que está em
 * volta: os raios viram o recorte da lua. É a mesma peça mudando de estado, e
 * não dois desenhos alternando.
 */
export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const claro = theme === 'claro'

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={claro ? 'Mudar para o tema escuro' : 'Mudar para o tema claro'}
      className="press flex h-11 w-11 shrink-0 items-center justify-center
                 rounded-full text-ink-faint hover:bg-overlay hover:text-ink
                 md:h-10 md:w-10"
    >
      <svg
        viewBox="0 0 24 24"
        width={20}
        height={20}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        focusable="false"
      >
        {claro ? (
          // Lua: o mesmo círculo, mordido.
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
        ) : (
          <>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
          </>
        )}
      </svg>
    </button>
  )
}
