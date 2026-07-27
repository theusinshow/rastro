import { StatusBar } from '@/components/layout/StatusBar'
import { TopBar } from '@/components/layout/TopBar'

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-void">
      <TopBar />

      <div className="relative flex-1">
        {/* Substituído pelo <MapCanvas /> na Tarefa 8. */}
        <div className="absolute inset-0 bg-void" />

        {/* Overlay das rotas. Não intercepta o mapa; cada painel reativa
            pointer-events por conta própria. */}
        <div className="pointer-events-none absolute inset-0">{children}</div>
      </div>

      <StatusBar />
    </div>
  )
}
