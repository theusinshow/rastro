import type { Metadata } from 'next'
import { Archivo, JetBrains_Mono } from 'next/font/google'
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      {/* A família vem de `body` em `globals.css`, junto do piso de 17px. */}
      <body>{children}</body>
    </html>
  )
}
