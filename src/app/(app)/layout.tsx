import { getProfileRepository } from '@/lib/data'
import { getViewer } from '@/lib/data/viewer'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { VisiblePlacesProvider } from '@/components/explore/visible-places-context'
import { OriginProvider } from '@/components/layout/origin-context'
import { ViewerProvider } from '@/components/layout/viewer-context'
import { StatusBar } from '@/components/layout/StatusBar'
import { TopBar } from '@/components/layout/TopBar'
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
        <PickerProvider>
          <VisiblePlacesProvider>
            {/*
              O mapa sangra de borda a borda e todo o cromo flutua por cima.
              Ver ADR 0010: o produto declarava o mapa como estrutura e o
              desenhava como o buraco no meio das barras.

              A superfície do mapa não está mais aqui: subiu para o layout raiz
              pelo ADR 0018, para atravessar também a tela de entrada. Este bloco
              continua sendo o cromo do app, e continua transparente por cima
              dela.
            */}
            {/*
              `pointer-events-none` no contêiner INTEIRO, e não só no overlay
              das rotas.

              Este bloco cobre a viewport toda e desenha por cima do mapa. Isso
              era inofensivo enquanto o mapa era filho dele: o evento subia do
              canvas e chegava aos handlers do MapLibre por bolhamento. Quando o
              mapa subiu para o layout raiz (ADR 0018), ele virou um irmão que
              fica ATRÁS — e o contêiner virou uma tampa de 1440×900 sobre a
              superfície do produto.

              O efeito, medido no navegador: **a roda do mouse não dava zoom em
              lugar nenhum do mapa.** 49 de 121 pontos sondados paravam aqui em
              vez de chegar no canvas. Não havia erro, não havia aviso — o mapa
              simplesmente não respondia, e cada peça de cromo parecia culpada.

              Agora o contêiner é transparente ao ponteiro e **cada peça reativa
              o que precisa**: as duas barras porque são controles, o overlay das
              rotas pelos painéis que moram nele. O que não é cromo deixa o
              evento passar direto para o mapa.
            */}
            <div className="pointer-events-none relative h-screen overflow-hidden">
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
      </OriginProvider>
    </ViewerProvider>
  )
}
