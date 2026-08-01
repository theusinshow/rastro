import { getProfileRepository } from '@/lib/data'
import { getViewer } from '@/lib/data/viewer'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { VisiblePlacesProvider } from '@/components/explore/visible-places-context'
import { OriginProvider } from '@/components/layout/origin-context'
import { ViewerProvider } from '@/components/layout/viewer-context'
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

  // Sai da MESMA sessão que o perfil acima, sem uma segunda ida à autenticação:
  // `sessionContext` é memoizado por requisição.
  const viewer = isSupabaseConfigured() ? await getViewer() : { isGuest: false }

  return (
    <ViewerProvider viewer={viewer}>
      <OriginProvider
        origin={profile?.home ?? null}
        label={profile?.homeLabel ?? null}
      >
        <MapProvider>
          <PickerProvider>
            <VisiblePlacesProvider>
              {/*
                O mapa sangra de borda a borda e todo o cromo flutua por cima.
                Ver ADR 0010: o produto declarava o mapa como estrutura e o
                desenhava como o buraco no meio das barras.

                Ele vive aqui, no layout, e não nas páginas: navegar entre as
                rotas não desmonta a instância do MapLibre. Ver ADR 0002.
              */}
              <div className="relative h-screen overflow-hidden bg-void">
                <MapCanvas />

                <TopBar />

                {/* Overlay das rotas. Não intercepta o mapa; cada painel reativa
                    pointer-events por conta própria.

                    O `z-panel` é o degrau da escala de empilhamento documentada
                    em `globals.css`: sem ele os controles do MapLibre, que
                    trazem `z-index: 2` de fábrica, desenham por cima dos
                    painéis. */}
                <div className="pointer-events-none absolute inset-0 z-(--z-panel)">
                  {children}
                </div>

                <StatusBar />
              </div>
            </VisiblePlacesProvider>
          </PickerProvider>
        </MapProvider>
      </OriginProvider>
    </ViewerProvider>
  )
}
