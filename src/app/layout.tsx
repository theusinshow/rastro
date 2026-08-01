import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Archivo, JetBrains_Mono } from 'next/font/google'
import { DEFAULT_THEME, THEME_COOKIE, isTheme } from '@/lib/theme'
import { ThemeProvider } from '@/components/layout/theme-context'
import './globals.css'

/**
 * Archivo com o eixo de largura exposto: `.type-display` e `.type-title` usam
 * `font-stretch` para o topo da hierarquia, o que evita carregar uma terceira
 * família só para títulos. Ver ADR 0009.
 */
const sans = Archivo({
  subsets: ['latin'],
  variable: '--font-sans',
  axes: ['wdth'],
})

const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Rastro',
  description: 'Para onde eu vou, onde eu já estive, o que ainda quero conhecer.',
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Lido no SERVIDOR, e escrito no `<html>` antes de qualquer pintura. Resolver
  // isso no cliente daria um quadro inteiro no tema errado a cada carga — e um
  // piscar de tela cheia é o pior defeito visual possível num produto que se
  // abre no sol, com o olho já adaptado.
  const cookieStore = await cookies()
  const salvo = cookieStore.get(THEME_COOKIE)?.value
  const theme = isTheme(salvo) ? salvo : DEFAULT_THEME

  return (
    <html
      lang="pt-BR"
      data-theme={theme}
      className={`${sans.variable} ${mono.variable}`}
    >
      {/* A família vem de `body` em `globals.css`, junto do piso de 17px. */}
      <body>
        <ThemeProvider initial={theme}>{children}</ThemeProvider>
      </body>
    </html>
  )
}
