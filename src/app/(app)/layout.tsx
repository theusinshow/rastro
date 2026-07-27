import { VisiblePlacesProvider } from '@/components/explore/visible-places-context'
import { StatusBar } from '@/components/layout/StatusBar'
import { TopBar } from '@/components/layout/TopBar'
import { MapCanvas } from '@/components/map/MapCanvas'
import { MapProvider } from '@/components/map/map-context'

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <MapProvider>
      <VisiblePlacesProvider>
        <div className="flex h-screen flex-col overflow-hidden bg-void">
          <TopBar />

          {/* O mapa vive aqui, no layout, e não nas páginas: navegar entre as
              rotas não desmonta a instância do MapLibre. Ver ADR 0002. */}
          <div className="relative flex-1">
            <MapCanvas />

            {/* Overlay das rotas. Não intercepta o mapa; cada painel reativa
                pointer-events por conta própria.

                O `z-20` é o degrau da escala de empilhamento documentada em
                `globals.css`: sem ele os controles do MapLibre, que trazem
                `z-index: 2` de fábrica, desenham por cima dos painéis. */}
            <div className="pointer-events-none absolute inset-0 z-20">
              {children}
            </div>
          </div>

          <StatusBar />
        </div>
      </VisiblePlacesProvider>
    </MapProvider>
  )
}
