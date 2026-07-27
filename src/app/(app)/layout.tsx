import { StatusBar } from '@/components/layout/StatusBar'
import { TopBar } from '@/components/layout/TopBar'
import { MapCanvas } from '@/components/map/MapCanvas'
import { MapProvider } from '@/components/map/map-context'

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <MapProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-void">
        <TopBar />

        {/* O mapa vive aqui, no layout, e não nas páginas: navegar entre as
            rotas não desmonta a instância do MapLibre. Ver ADR 0002. */}
        <div className="relative flex-1">
          <MapCanvas />

          {/* Overlay das rotas. Não intercepta o mapa; cada painel reativa
              pointer-events por conta própria. */}
          <div className="pointer-events-none absolute inset-0">{children}</div>
        </div>

        <StatusBar />
      </div>
    </MapProvider>
  )
}
