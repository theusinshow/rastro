# Rastro — Design da Fundação e do Explore

- **Data:** 2026-07-27
- **Status:** Aprovado
- **Escopo:** Fundação do projeto + tela Dashboard / Explore

---

## 1. Produto

Rastro é um web app pessoal para organizar, descobrir e registrar viagens de moto.

Não é um navegador GPS. O Google Maps responde *"como chego lá?"*. O Rastro responde:

- Para onde eu vou?
- Onde eu já estive?
- O que ainda quero conhecer?
- Quais histórias ficaram dessas viagens?

O mapa é a memória visual da vida do motociclista. Ele é o elemento estrutural da
interface, não um widget dentro de um card.

**Usuário inicial:** um (o autor), baseado em Palhoça / Grande Florianópolis, SC,
pilotando uma CFMOTO IBEX 450. A arquitetura de dados nasce multiusuário para não
exigir reconstrução depois.

### Não-objetivos desta entrega

Rede social, scraping, integração com Instagram, IA, algoritmo complexo de
recomendação, tracking GPS em tempo real, app mobile nativo, gamificação avançada,
feed público.

---

## 2. Decisões tomadas antes do design

| Tema | Decisão |
|---|---|
| Basemap | MapTiler (vector tiles + terrain-RGB) com `style.json` autoral |
| Persistência | Migrations SQL versionadas agora; app roda em repositório mock |
| Idioma | UI em PT-BR, código/schema em inglês |

---

## 3. Stack

- **Next.js (App Router)** + **React** + **TypeScript** em modo `strict`
- **Tailwind CSS v4** (configuração CSS-first via `@theme`)
- **shadcn/ui** apenas onde há ganho real de acessibilidade (primitivas Radix:
  popover, slider, checkbox, tooltip). Não como fonte da estética.
- **maplibre-gl** puro, sem wrapper React
- **Supabase** (Postgres + Storage + Auth) — schema definido, conexão posterior
- Deploy alvo: **Vercel**

Nenhuma biblioteca de estado global, nenhuma biblioteca de datas, nenhum wrapper de
mapa. Cada dependência nova exige justificativa registrada.

---

## 4. Modelo de dados

### 4.1 Princípio central

O brief original tratava `Place` como uma entidade única contendo tanto o fato
objetivo quanto a opinião pessoal. Isso funciona com um usuário e quebra com dois.

**Separamos três conceitos:**

| Tabela | Natureza | Exemplo |
|---|---|---|
| `places` | Fato compartilhado | Serra do Rio do Rastro fica em (-28.39, -49.53), categoria `serra` |
| `place_user_states` | Vínculo usuário ↔ lugar | Eu favoritei, eu quero conhecer, minha nota |
| `place_visits` | Evento datado | Estive lá em 26/07/2026, avaliei 5 estrelas |

Consequências:

- "Visitado" deixa de ser booleano e passa a ser *existe ao menos uma visita*.
- É possível visitar o mesmo lugar várias vezes, cada visita com data e avaliação.
- `place_user_states.last_visited_at` e `.visit_count` são **cache derivado**,
  mantidos por trigger a partir de `place_visits`. A verdade está nos eventos.

Há três campos `rating` no schema e eles medem coisas diferentes — não são
duplicação:

| Campo | Significa |
|---|---|
| `place_visits.rating` | Como foi **aquela visita** específica |
| `place_user_states.rating` | Minha opinião **geral e atual** sobre o lugar |
| `trips.rating` | Como foi **a viagem** como um todo |

### 4.2 Decisão: sem tabela `Favorite`

O brief sugeria uma entidade `Favorite`. Ela seria uma tabela de duas colunas
duplicando informação que `place_user_states.is_favorite` já carrega, e adicionaria
um JOIN em toda leitura do mapa — o caminho mais quente da aplicação. Favorito é um
**atributo do vínculo** usuário↔lugar, não uma entidade própria.

Registrado em `docs/decisions/0003`.

### 4.3 Decisão: sem PostGIS nesta fase

`latitude` e `longitude` como `double precision`. Distâncias por fórmula de
haversine em código puro (`src/domain/geo.ts`).

PostGIS (`geography(Point)` + `ST_DWithin` + índice GiST) é a ferramenta correta
para consultas por raio, mas com centenas de lugares o ganho é irrelevante e
quebraria a paridade entre o repositório mock e o repositório Supabase. Fica
documentado como upgrade em `docs/decisions/0004`, acionável quando o catálogo
crescer.

### 4.4 Tabelas

```
profiles           id(→auth.users) display_name home_lat home_lng home_label
motorcycles        id user_id make model year nickname is_default odometer_km
places             id slug name description latitude longitude municipality state
                   country category tags[] cover_image_url source created_by
                   is_public created_at updated_at
place_user_states  (user_id, place_id) is_favorite wants_to_visit personal_notes
                   rating first_visited_at last_visited_at visit_count
place_visits       id user_id place_id trip_id? visited_at notes rating
trips              id user_id motorcycle_id title slug status started_at ended_at
                   origin_label origin_lat origin_lng primary_place_id
                   distance_km duration_minutes rating notes route_geojson
trip_stops         id trip_id place_id? order_index label latitude longitude
                   kind arrived_at notes
trip_photos        id trip_id user_id place_id? storage_path width height
                   latitude longitude taken_at caption exif sort_index
```

**Enums:** `place_category` (serra, praia, mirante, natureza, cachoeira, estrada,
cidade, cafe, restaurante, ponto_turistico), `trip_status` (planned, ongoing,
completed), `trip_stop_kind` (start, waypoint, destination, fuel, meal).

**Rota da viagem:** `route_geojson jsonb` — sem tipo geométrico dedicado, coerente
com 4.3.

**Fotos:** nascem com `latitude`, `longitude`, `taken_at` e `exif jsonb`. Nenhum
processamento de EXIF é implementado agora; apenas o schema está pronto para
receber os dados quando for.

### 4.5 Multiusuário e RLS

Toda tabela com dado pessoal carrega `user_id`. Todas as policies de RLS são
escritas já nesta migration, mesmo havendo um único usuário:

- Tabelas pessoais: `user_id = auth.uid()` para todas as operações.
- `places`: leitura quando `is_public = true` ou `created_by = auth.uid()`;
  escrita apenas quando `created_by = auth.uid()`.

Enquanto não há autenticação, o repositório mock opera sob um `DEV_USER_ID`
constante, com a mesma forma de dados que o repositório Supabase entregará.

### 4.6 Estatísticas e timeline (arquitetura, não implementação)

Nenhuma tela é construída agora, mas o schema já responde às perguntas do brief:

- km viajados / viagens / maior viagem → agregações sobre `trips`
- lugares e municípios visitados → `place_visits` ⋈ `places.municipality`
- mês com mais viagens → `date_trunc` sobre `trips.started_at`
- km por moto → `trips` agrupado por `motorcycle_id`
- timeline de Memórias → `trips` com `status = completed` ordenado por
  `started_at desc`, agrupado por ano e mês na camada de domínio

---

## 5. Camada de acesso a dados

```
src/lib/data/place-repository.ts        interface PlaceRepository
src/lib/data/mock/place-repository.ts   implementação em memória  ← v1
src/lib/data/supabase/…                 implementação futura
```

A UI depende apenas da interface. Trocar de mock para Supabase é substituir o
adapter, sem tocar em componente algum.

Regra de camadas, verificável por leitura:

- `src/domain/` — tipos e regras puras. **Nunca** importa React, Next ou UI.
- `src/lib/data/` — acesso a dados. Importa `domain`, nunca `components`.
- `src/components/` — apresentação. Não calcula distância, não filtra, não ordena.

---

## 6. Estratégia do mapa

### 6.1 MapLibre sem wrapper

`maplibre-gl` é usado diretamente através de um hook `useMapInstance` e um contexto
pequeno. `react-map-gl` custaria uma dependência e um modelo mental adicional para
economizar cerca de 80 linhas, ao preço de perder controle fino sobre camadas e
expressões.

### 6.2 Estilo autoral

`style.json` escrito por nós sobre os vector tiles do MapTiler (schema
OpenMapTiles), não um estilo pronto:

- paleta escura própria, água quase preta
- **malha viária em destaque** — num app de moto, a estrada é o conteúdo, não o
  fundo
- labels em Geist Mono
- **hillshade** a partir de terrain-RGB: as serras catarinenses ganham relevo real

### 6.3 Mapa persistente no layout

O `<MapCanvas>` vive em `src/app/(app)/layout.tsx`, não nas páginas. Navegar entre
Explorar, Descobrir, Viagens e Memórias **não remonta a instância do MapLibre** —
apenas o overlay muda. É o que faz o produto parecer um instrumento contínuo em vez
de um site com um mapa dentro. Registrado em `docs/decisions/0002`.

### 6.4 Estados do pin

Os cinco estados do brief não são mutuamente exclusivos: um lugar pode ser
simultaneamente visitado, favorito e com fotos. Codificar cada um como uma cor
tornaria as combinações irrepresentáveis. Usamos três canais visuais independentes:

| Canal | Representa |
|---|---|
| **Cor do pin** | Status de visita — não visitado (contorno frio, miolo vazado) · quero conhecer (âmbar) · visitado (verde-sinal) |
| **Anel externo** | Favorito |
| **Ponto satélite** | Possui fotos |

Renderizado com *circle layers* data-driven do MapLibre (expressões `match` sobre
propriedades do GeoJSON), não com marcadores HTML. Performa em escala e produz
leitura cartográfica genuína em vez de UI colada sobre o mapa.
Registrado em `docs/decisions/0005`.

### 6.5 Estado na URL

Filtros e lugar selecionado vivem nos search params:

```
/?cat=serra,mirante&raio=150&status=nao-visitado&fav=1&place=serra-do-rio-do-rastro
```

Sem biblioteca de estado global. Links compartilháveis, botão voltar funcional,
estado sobrevive a refresh. Registrado em `docs/decisions/0006`.

---

## 7. Direção visual

### 7.1 O que evitar, concretamente

Excesso de cards, gradientes aleatórios, glassmorphism exagerado, arredondamento
universal, ícones decorativos, dashboards de widgets.

Traduzido em regras aplicáveis:

- **Raio máximo de 2px**, maioria dos elementos em 0
- **Nenhuma sombra difusa** — separação por *hairlines* de 1px, como grade
  cartográfica
- **Nenhum card contendo conteúdo primário** — conteúdo primário ocupa estrutura
- **Ícone só quando substitui texto**, nunca ao lado dele por decoração
- Blur apenas onde é necessário para legibilidade sobre o mapa, nunca como estética

### 7.2 Paleta

Base em carvão levemente frio, não preto puro — referência de carta náutica
noturna. Acento **âmbar de instrumento** (`#F0A32B`): cor de painel de moto, farol e
GPS outdoor. É deliberadamente o oposto do azul de SaaS.

Verde-sinal para visitado, contorno frio neutro para não visitado. Valores exatos e
tokens semânticos ficam em `docs/DESIGN-SYSTEM.md`.

### 7.3 Tipografia

**Geist Sans** para interface, **Geist Mono** para dados. Ambas via `next/font`,
sem requisição de rede externa.

Todo dado numérico — quilometragem, coordenada, duração, data, zoom — é renderizado
em mono. Labels de instrumento em maiúsculas pequenas com tracking largo. Essa
única regra carrega boa parte do caráter técnico do produto.

### 7.4 Layout do Explore

```
┌──────────────────────────────────────────────────────────┐
│ ▌RASTRO   EXPLORAR  DESCOBRIR  VIAGENS  MEMÓRIAS         │
├─────┬──────────────────────────────────────────┬─────────┤
│ F   │                                          │ PAINEL  │
│ I   │           M A P A   full-bleed           │   DO    │
│ L   │                                          │  LUGAR  │
│ T   │   ┌────────────────────┐                 │  380px  │
│ R   │   │ PARA ONDE VAMOS? → │                 │         │
│ O S │   └────────────────────┘                 │         │
├─────┴──────────────────────────────────────────┴─────────┤
│ ⌖ -27.6386 -48.6703   Z12   ● 14 lugares   ⌂ Palhoça, SC │
└──────────────────────────────────────────────────────────┘
```

- **Topbar** 48px, translúcida, hairline inferior
- **Filtros** em coluna estreita colapsável à esquerda — não um card
- **Painel do lugar** 380px, desliza sobre o mapa, hairline à esquerda, foto em
  bleed no topo. Painel contextual, não modal central.
- **Statusbar** inferior em mono: coordenadas do centro, zoom, contagem de lugares
  visíveis, origem. Custa pouco e define a percepção de instrumento.

Ações do painel: SALVAR · QUERO CONHECER · CRIAR VIAGEM · MARCAR COMO VISITADO ·
ABRIR ROTA. Nesta entrega, apenas as que operam sobre dados locais são funcionais;
as demais ficam desabilitadas com rótulo explícito, nunca em silêncio.

### 7.5 Responsividade

Desktop é prioridade agora. Mobile não será o desktop encolhido: o mapa vira
fullscreen, o painel lateral vira bottom sheet arrastável e a navegação vai para
baixo.

Preparação concreta nesta entrega: `PlacePanel` é agnóstico de container e recebe
apresentação por composição, permitindo trocar o invólucro sem reescrever o
conteúdo.

---

## 8. Descoberta — "Para onde vamos?"

Formulário: local de partida, tempo disponível (2h / 4h / 6h / dia inteiro),
distância (50 / 100 / 150 / 300 km / personalizada), categorias, e as opções
*somente não visitados* e *somente favoritos*.

Algoritmo v1, deliberadamente simples e puro (`src/domain/discovery.ts`):

1. Filtrar por categoria e pelas opções marcadas
2. Calcular haversine da origem até cada lugar
3. Descartar acima do raio
4. Estimar tempo de viagem e descartar o que não cabe no tempo disponível
5. Ordenar por adequação e retornar

A estimativa de tempo usa uma constante de velocidade média exportada de
`src/domain/discovery.ts`, aplicada sobre a distância em linha reta corrigida por
um fator de sinuosidade — também constante e também exportado. Ambos ficam
nomeados e documentados no módulo, não espalhados como números mágicos. Não há
tela de configuração para eles nesta entrega.

Sem IA, sem roteamento real, sem serviço externo. Os resultados são realçados no
mapa, que permanece o mesmo — a Descoberta é um overlay sobre o mapa persistente.

---

## 9. Dados de desenvolvimento

Cerca de 14 lugares de Santa Catarina em `src/mocks/`, incluindo Serra do Rio do
Rastro, Urubici, Guarda do Embaú, Rancho Queimado, Santo Amaro da Imperatriz, Serra
do Corvo Branco, Garopaba e Florianópolis. Uma moto: CFMOTO IBEX 450.

**Estes são dados de desenvolvimento.** Coordenadas, distâncias e avaliações não
devem ser tratadas como informação verificada. Cada registro carrega
`source: 'mock'` e o arquivo abre com aviso explícito, de forma que dados reais
possam substituí-los sem ambiguidade sobre o que foi verificado.

---

## 10. Estrutura de diretórios

```
CLAUDE.md · CHANGELOG.md · README.md · .env.example
docs/
  ARCHITECTURE.md  DESIGN-SYSTEM.md  DATA-MODEL.md  MAP-STRATEGY.md
  ROADMAP.md  CONTRIBUTING.md
  decisions/       ADRs 0001–0006
  skills/          README + briefings para impeccable, frontend-design,
                   web-design-guidelines
  superpowers/specs/
supabase/migrations/0001_initial_schema.sql
src/
  app/(app)/       layout com mapa persistente; page(Explore), descobrir,
                   viagens, memorias
  components/      map/  explore/  layout/  ui/
  domain/          place.ts trip.ts motorcycle.ts geo.ts filters.ts discovery.ts
  lib/data/        interfaces + adapters
  lib/map/         style, layers, hooks
  mocks/
```

---

## 11. Governança

### ADRs desta fase

| # | Decisão |
|---|---|
| 0001 | Next.js App Router, TypeScript strict e limite explícito de dependências |
| 0002 | Mapa persistente no layout do route group, não nas páginas |
| 0003 | Estado pessoal separado do catálogo; sem tabela `Favorite` |
| 0004 | Sem PostGIS nesta fase; haversine em código |
| 0005 | Pins como circle layers data-driven com três canais visuais |
| 0006 | Filtros e seleção na URL, sem biblioteca de estado global |

**Regra primordial:** todo commit exige entrada correspondente em `CHANGELOG.md`
(formato Keep a Changelog). Commit sem entrada no changelog não acontece.

Antes de considerar qualquer etapa concluída: `lint` e `typecheck` limpos.
Decisões arquiteturais relevantes nunca mudam em silêncio — viram ADR.

`docs/skills/` contém briefings de contexto do Rastro (paleta, anti-padrões,
restrições do mapa, camadas) para invocar skills de design sem receber resultado
genérico de volta.

---

## 12. Escopo da primeira entrega

**Entra:** shell com navegação e statusbar · mapa com estilo autoral e hillshade ·
pins com os três canais visuais · painel lateral do lugar · filtros de categoria,
raio, status de visita e favoritos · "Para onde vamos?" funcional · 14 lugares
mockados · migrations SQL completas com RLS · documentação e ADRs · lint e
typecheck limpos.

**Fica fora:** tudo listado em Não-objetivos. Viagens e Memórias entram como rotas
stub apenas para travar a navegação.

**Dependência externa:** chave de API do MapTiler
(`NEXT_PUBLIC_MAPTILER_KEY`). Na ausência dela a aplicação exibe um estado de
fallback explícito em vez de falhar silenciosamente.
