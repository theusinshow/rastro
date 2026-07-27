# Arquitetura do Rastro

Este documento descreve como o código se organiza em camadas, o que cada
camada pode e não pode importar, o fluxo completo de uma requisição do
Explore, o padrão de "componente sem DOM" usado na integração com o mapa, os
contextos React existentes e o índice das decisões arquiteturais registradas.

Para a linguagem visual, ver `docs/DESIGN-SYSTEM.md`. Para o schema do banco,
`docs/DATA-MODEL.md`. Para a estratégia do mapa, `docs/MAP-STRATEGY.md`.

---

## Camadas

```
src/domain/                (tipos e funções puras)
      │
      ├──▶ src/lib/data/   (repositório de dados)
      └──▶ src/lib/map/    (integração com MapLibre)
                  │
                  ▼
         src/components/   (React: primitivos de UI, mapa, explore, layout)
                  │
                  ▼
         src/app/          (rotas do Next.js — App Router)
```

A regra, verificável por leitura de imports (a de `CLAUDE.md`, aqui com as
duas pastas de apoio de `src/lib/` explicitadas):

| Camada | Pode importar | Nunca importa |
|---|---|---|
| `src/domain/` | nada do projeto além de `domain` | React, Next, componentes, dados |
| `src/lib/data/` | `domain` | componentes |
| `src/lib/map/` | `domain` | componentes de página |
| `src/lib/motion/` | React | `domain`, `lib/data`, `lib/map`, componentes |
| `src/lib/utils/` | nada do projeto | qualquer coisa do projeto |
| `src/components/` | `domain`, `lib` | outros repositórios diretamente |

`src/lib/motion/` é a única pasta fora de `src/components/` que contém hooks
React, e isso é deliberado: `useReducedMotion` e `useExitTransition` são
mecanismos de movimento reaproveitados por vários componentes, não regra de
negócio. Ficariam errados em `src/domain/`, que não importa React por
princípio, e errados dentro de um componente específico, que os prenderia a
uma tela. `animate-progress.ts`, no mesmo diretório, não é hook — é função
pura testada em `animate-progress.test.ts`.

`src/lib/utils/` guarda utilitário genérico sem nenhuma noção do produto —
hoje só `cn.ts`, quatro linhas que concatenam classes. Não importa nada do
projeto, e é por isso que qualquer camada pode importá-lo.

### Por que a regra existe

- **`src/domain/` não importa React/Next.** É a camada testada por
  `vitest run` em ambiente `node`, sem `jsdom` — `geo.test.ts`,
  `place.test.ts`, `filters.test.ts`, `discovery.test.ts`, `dates.test.ts`
  rodam sem montar um DOM. Se o domínio importasse React, testar uma
  conta de haversine exigiria toda a maquinaria de um ambiente de componente.
  Além disso, funções puras e testáveis são reaproveitáveis fora do React —
  num futuro script de importação de lugares, por exemplo — sem arrastar a
  UI junto.
- **`src/lib/data/` importa `domain`, nunca componentes.** O repositório fala
  a língua do domínio (`ExplorePlace`), não a língua de um componente
  específico. Isso é o que permite trocar o adapter mock por um adapter
  Supabase sem tocar em nenhuma tela: a interface `PlaceRepository`
  (`src/lib/data/place-repository.ts`) é o contrato, e `src/lib/data/index.ts`
  é o único ponto que decide qual adapter está ativo.
- **`src/lib/map/` importa `domain`, nunca componentes de página.** A
  integração com o MapLibre (`config.ts`, `style.ts`, `layers.ts`) é
  genérica: sabe desenhar um `ExplorePlace` como pin, não sabe que existe uma
  rota `/descobrir`. Isso é o que permite ao `PlacesLayer` ser reaproveitado
  tanto pelo Explore quanto pela Descoberta sem duplicar lógica de camada.
- **Componente visual não contém lógica de negócio.** Não calcula distância,
  não filtra, não ordena, não decide elegibilidade. Essas operações vivem em
  `src/domain/` como função pura e testável (`haversineKm`, `filterPlaces`,
  `findDestinations`, `deriveVisitStatus`). Um componente que calculasse
  distância duplicaria uma regra de negócio num lugar sem teste unitário
  fácil e sem reaproveitamento entre Explore e Descoberta.
- **Componentes nunca importam outro repositório diretamente.** Toda leitura
  de dados passa por `placeRepository` de `src/lib/data`, nunca por um
  adapter concreto (`mockPlaceRepository`) importado direto de uma página ou
  componente — assim a troca de adapter em `index.ts` não exige caçar
  imports espalhados pelo projeto.

---

## O route group `(app)` e o mapa persistente

`src/app/(app)/` agrupa as quatro áreas do produto — Explorar (`/`, `page.tsx`),
Descobrir (`descobrir/page.tsx`), Viagens (`viagens/page.tsx`) e Memórias
(`memorias/page.tsx`) — sob um único `layout.tsx` compartilhado
(`src/app/(app)/layout.tsx`). O parêntese no nome da pasta é a convenção do
Next.js para agrupar rotas sob um layout comum **sem** que o nome do grupo
apareça na URL.

Esse layout é onde `<MapCanvas />` vive — não dentro de cada página. A
instância do MapLibre é montada uma única vez, dentro de `<MapProvider>`, e as
quatro rotas renderizam apenas overlays sobre ela, num contêiner irmão
`pointer-events-none` (cada painel reativa `pointer-events` por conta
própria). Isso significa que navegar entre `/` e `/viagens` não desmonta nem
recria o WebGL, preservando posição, zoom e os tiles já carregados.

A razão completa — o custo de recriar o contexto WebGL a cada navegação, a
recarga de tiles, o piscar de tela — e a alternativa recusada (sincronizar a
câmera via URL) estão em
[ADR 0002 — Mapa persistente no layout](./decisions/0002-mapa-persistente-no-layout.md).

---

## Fluxo de dados de uma requisição do Explore

Do primeiro byte servido até o pin aparecer no mapa:

1. **`src/app/(app)/page.tsx`** é um Server Component. Ele chama
   `await placeRepository.listExplorePlaces()` — `placeRepository` vem de
   `src/lib/data`, que hoje aponta para `mockPlaceRepository`
   (`src/lib/data/mock/mock-place-repository.ts`). O retorno é
   `ExplorePlace[]`: o catálogo já combinado com o estado pessoal do usuário
   (`toExplorePlace(place, userState)` de `src/domain/place.ts`).
2. A página passa essa lista como prop para
   **`<ExploreView places={places} />`** (`src/components/explore/ExploreView.tsx`),
   o primeiro componente de cliente do caminho.
3. `ExploreView` envolve o conteúdo real em `<Suspense fallback={null}>`
   porque o componente interno usa `useSearchParams` (ver seção de contextos
   e Suspense abaixo).
4. Dentro do Suspense, **`ExploreContent`** chama `useExploreFilters()`
   (`src/components/explore/use-explore-filters.ts`), que lê os parâmetros
   `cat`, `raio`, `status` e `fav` da URL via `useSearchParams` e monta um
   objeto `ExploreFilters` (`src/domain/filters.ts`).
5. `ExploreContent` aplica **`filterPlaces(places, filters, DEFAULT_ORIGIN)`**
   — função pura de `src/domain/filters.ts` — obtendo `visible: ExplorePlace[]`,
   a lista já recortada por categoria, raio, situação de visita e favoritos
   (todos os critérios combinados com E).
6. `visible` é entregue a
   **`<PlacesLayer places={places} visible={visible} … />`**
   (`src/components/map/PlacesLayer.tsx`), **junto com a lista completa**.
7. `PlacesLayer` obtém a instância do MapLibre via `useMapInstance()`
   (contexto `MapProvider`). No efeito de dados, chama
   **`buildPlacesGeoJson(places, matched, previouslyMatched)`**
   (`src/lib/map/layers.ts`) e chama **`source.setData(...)`** sobre a fonte
   `places` já registrada no mapa.

   **A fonte recebe todos os lugares, sempre.** O recorte chega como a
   propriedade booleana `matched` de cada feature, e não como ausência: o
   MapLibre não consegue interpolar uma feature que deixou de existir, e sem
   isso marcar um filtro faria treze dos catorze pins sumirem em um quadro.
   Quem decide o recorte continua sendo `filterPlaces`, no domínio; o que muda
   é como o resultado é representado no mapa. `previouslyMatched` é o recorte
   anterior, e existe só para que o crossfade saiba quem entrou e quem saiu.

   A interpolação em si roda em `src/lib/map/paint.ts`, dirigida por
   `requestAnimationFrame`, porque o MapLibre ignora `*-transition` em qualquer
   propriedade de pintura dirigida por dados.
8. Ainda em `PlacesLayer`, mudar `place` na URL move a câmera
   (`src/lib/map/camera.ts`): reposiciona quando a seleção veio de um clique no
   pin, aproxima quando veio de uma lista. O `padding` corresponde às larguras
   dos painéis da rota, para que o pin selecionado não termine embaixo deles.
9. Em paralelo, `ExploreContent` publica `visible.length` no
   `VisiblePlacesProvider` via `useSetVisiblePlaceCount()`, e a `StatusBar`
   (montada no layout persistente, fora da árvore da página) lê esse valor
   via `useVisiblePlaceCount()` para mostrar a contagem de lugares visíveis.

O mesmo caminho, com `findDestinations` no lugar de `filterPlaces`, é usado
por `DiscoveryView`/`DiscoveryContent` na rota `/descobrir` — que reaproveita
o mesmo `PlacesLayer`, apenas alimentado por outra lista.

### Nota: hoje `/` e `/descobrir` são pré-renderizadas como estáticas

Apesar de `page.tsx` ser um Server Component com `await`, `next build` marca as
duas rotas como estáticas. A razão é o adapter ativo: `mockPlaceRepository`
resolve a partir de um array em memória, sem rede nem banco, então o Next.js
consegue executar a página em tempo de build e servir HTML pronto.

Isso é consequência do mock, não uma propriedade da arquitetura. Quando o
adapter Supabase entrar (`src/lib/data/index.ts`), a leitura passa a depender
de requisição e as duas rotas viram dinâmicas — sem que nenhuma linha de
componente mude. Vale saber disso antes de olhar para a saída de `next build`
hoje e concluir que o Explore é uma página estática por desenho.

---

## `PlacesLayer`: o padrão "componente sem DOM"

`src/components/map/PlacesLayer.tsx` renderiza `null`. Ele não produz nenhum
nó visual próprio — existe inteiramente para amarrar o ciclo de vida de
camadas nativas do MapLibre (`addSource`/`addLayer`, `removeLayer`/`removeSource`)
ao ciclo de vida de um componente React (`useEffect` de montagem e limpeza).

Isso permite que o React decida quando a fonte de pins existe — ela pode ser
desmontada e remontada, por exemplo ao trocar de rota dentro de `(app)`, sem
que nada precise ser desenhado em HTML/CSS para isso acontecer. A limpeza
verifica `map.getStyle()` antes de remover camadas, porque `MapCanvas` pode já
ter chamado `map.remove()` antes do efeito de limpeza rodar — cenário comum em
Strict Mode, que monta e desmonta efeitos duas vezes em desenvolvimento.

O mesmo componente é reaproveitado, sem alterações, pela rota de Descoberta
para realçar apenas os resultados que cabem na busca — a prova de que separar
"o que desenhar" (prop `places`) de "como desenhar" (lógica interna do
componente) funcionou como pretendido.

---

## Contextos existentes

Dois contextos React no projeto, cada um com uma única responsabilidade:

| Contexto | Arquivo | Quem escreve | Quem lê |
|---|---|---|---|
| `MapProvider` | `src/components/map/map-context.tsx` | `MapCanvas` (`registerMap` no evento `load`, `updateView` a cada `move`) | `PlacesLayer` e qualquer componente futuro que precise da instância (`useMapInstance`); `StatusBar` (`useMapView`, para coordenadas e zoom) |
| `VisiblePlacesProvider` | `src/components/explore/visible-places-context.tsx` | `ExploreContent`, via `useSetVisiblePlaceCount()`, a cada mudança na lista filtrada (e limpa para `null` ao desmontar) | `StatusBar`, via `useVisiblePlaceCount()` |

`MapProvider` guarda dois pedaços de estado — `map: MapLibreMap | null` e
`view: MapView | null` — expostos por hooks separados (`useMapInstance`,
`useMapView`) para que um consumidor que só precisa de coordenadas não
force um re-render por causa da instância do mapa em si (que muda raramente).

`VisiblePlacesProvider` existe exclusivamente como ponte: a contagem de
lugares nasce na página do Explore, mas a `StatusBar` mora no layout, fora da
árvore da página. Não é dono de estado de filtro — isso é URL (ADR 0006) —
apenas repassa um número de um lado da árvore para o outro.

**Nota sobre `Suspense`:** `ExploreView` e `DiscoveryView` envolvem seu
conteúdo real (`ExploreContent`, `DiscoveryContent`) em
`<Suspense fallback={null}>` porque ambos usam, direta ou indiretamente
(`useSelectedPlace`, `useExploreFilters`), o hook `useSearchParams` do Next.js
— que exige um limite de Suspense acima de si para que `next build` não
falhe ao tentar pré-renderizar a rota estaticamente. O fallback é `null`
porque nada acima do Suspense desenha algo síncrono antes dos dados de busca
estarem disponíveis; na prática o fallback nunca chega a aparecer.

---

## Índice de ADRs

Decisões arquiteturais completas em `docs/decisions/`. Leia o ADR antes de
propor mudança estrutural na área que ele cobre — `CLAUDE.md` proíbe alterar
uma decisão registrada em silêncio.

| ADR | Título | Uma linha |
|---|---|---|
| [0001](./decisions/0001-stack-e-limite-de-dependencias.md) | Stack e limite de dependências | Next.js + React + TypeScript strict + Tailwind v4 + Vitest; `maplibre-gl` fixado em `^5.24.0` porque a v6 move o worker para um ESM irmão que o Turbopack não resolve; `react-map-gl`, estado global e libs de data recusados deliberadamente. |
| [0002](./decisions/0002-mapa-persistente-no-layout.md) | Mapa persistente no layout | `<MapCanvas />` vive em `(app)/layout.tsx`, não nas páginas, para que navegar entre as quatro áreas não recrie o WebGL nem recarregue tiles. |
| [0003](./decisions/0003-estado-pessoal-separado-do-catalogo.md) | Estado pessoal separado do catálogo | `places` (fato), `place_user_states` (opinião) e `place_visits` (evento datado) são tabelas distintas; não existe entidade `Favorite` — favorito é um atributo de `place_user_states`. |
| [0004](./decisions/0004-sem-postgis-nesta-fase.md) | Sem PostGIS nesta fase | Distância calculada por haversine em `src/domain/geo.ts`, sobre colunas `double precision` simples; PostGIS fica para quando o catálogo crescer ou surgir consulta por polígono. |
| [0005](./decisions/0005-pins-como-camadas-data-driven.md) | Pins como camadas data-driven | Três canais visuais independentes (miolo, anel de favorito, ponto de foto) desenhados como camadas nativas do MapLibre sobre uma fonte GeoJSON, não como marcadores HTML; o anel de favorito é osso, não âmbar, para não colidir com o miolo "quero conhecer". |
| [0006](./decisions/0006-estado-de-filtros-na-url.md) | Estado de filtros na URL | Filtros e seleção vivem inteiramente na URL (`useExploreFilters`, `useSelectedPlace`), escritos com `router.replace` — nunca `push` — para não encher o histórico a cada clique; consequência aceita: o botão voltar não desfaz um filtro por vez. |
