import { getProfileRepository } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { VisiblePlacesProvider } from '@/components/explore/visible-places-context'
import { OriginProvider } from '@/components/layout/origin-context'
import { StatusBar } from '@/components/layout/StatusBar'
import { TopBar } from '@/components/layout/TopBar'
import { MapCanvas } from '@/components/map/MapCanvas'
import { MapProvider } from '@/components/map/map-context'
import { PickerProvider } from '@/components/map/picker-context'

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // A origem é lida aqui, e não em cada página, porque alimenta a árvore
  // inteira: a barra de status, os filtros, o painel de lugar e a descoberta.
  const profile = isSupabaseConfigured()
    ? await (await getProfileRepository()).getProfile()
    : null

  return (
    <OriginProvider
      origin={profile?.home ?? null}
      label={profile?.homeLabel ?? null}
    >
      <MapProvider>
        <PickerProvider>
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
        </PickerProvider>
      </MapProvider>
    </OriginProvider>
  )
}
