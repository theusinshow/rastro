# Roteiro do Rastro

Sem prazos. Três blocos de intenção — o que vem a seguir, o que vem depois
disso, e o que é possível mas ainda incerto — mais um bloco do que é
deliberadamente fora de escopo. A ordem dentro de cada bloco não é prioridade
fixa.

Volte sempre ao princípio do produto (`CLAUDE.md`) em caso de dúvida: o
Google Maps responde "como chego lá?"; o Rastro responde "para onde eu vou?",
"onde eu já estive?", "o que ainda quero conhecer?" e "quais histórias
ficaram dessas viagens?".

---

## Próximo

- **Executar a migration `supabase/migrations/0001_initial_schema.sql` contra
  um Postgres real.** Verificação pendente: o Docker não está disponível
  neste ambiente de desenvolvimento, então o schema foi validado apenas por
  leitura estática do SQL, nunca rodado de fato. Este é o primeiro passo
  necessário antes de conectar o Supabase abaixo — se o schema tiver um erro
  de sintaxe ou uma referência inválida, é aqui que aparece.
- **Conectar o Supabase**, substituindo apenas `src/lib/data/index.ts` — o
  único ponto que decide qual adapter de `PlaceRepository` está ativo. Nenhum
  componente deveria precisar mudar.
- **Autenticação**, substituindo o `DEV_USER_ID` fixo (`src/mocks/user.ts`)
  por um usuário real autenticado. O schema já foi desenhado multiusuário
  desde a primeira migração (RLS por `user_id` em toda tabela de dado
  pessoal), então isto é uma questão de autenticação, não de migração de
  dados.
- **Ações de escrita do painel de lugar** — hoje `PlaceActions`
  (`src/components/explore/PlaceActions.tsx`) mostra os botões "Salvar",
  "Quero conhecer", "Marcar visitado" e "Criar viagem" como `disabled`,
  deliberadamente visíveis mas indisponíveis. Ligá-los a
  `place_user_states.is_favorite`/`wants_to_visit` e a uma nova linha em
  `place_visits`.
- **Registro de viagens com paradas** — criar `trips` e `trip_stops` a partir
  de uma viagem real, incluindo múltiplas paradas ordenadas
  (`trip_stops.order_index`).
- **Upload de fotos no Supabase Storage**, associadas a `trip_photos`, com o
  caminho gravado em `storage_path`.

## Depois

- **Tela de Memórias com timeline por ano e mês** — a rota `/memorias`
  existe hoje como stub explicativo (`src/app/(app)/memorias/page.tsx`);
  vira uma timeline real de `trips` com `status = 'completed'`.
- **Página de viagem concluída no formato de diário**, com mapa da rota
  (`trips.route_geojson`) e galeria de `trip_photos`.
- **Estatísticas** — quilometragem total, municípios visitados, maior
  viagem, quilometragem por moto, regiões exploradas. `docs/DATA-MODEL.md`
  já documenta, em "Perguntas que o schema já responde", a consulta em
  linguagem natural para cada uma.
- **Navegação mobile própria.** A folha inferior já existe: abaixo de 768px
  `OverlayPanel` deixa de ser painel lateral e vira bottom sheet
  (`src/app/globals.css`), e a navegação principal rola na horizontal em vez
  de cortar itens. O que falta é uma navegação desenhada para o toque — a
  barra do desktop rolando lateralmente resolve não quebrar, não é o alvo
  final.
- **Leitura de EXIF** para posicionar fotos no mapa automaticamente —
  `trip_photos.latitude`/`longitude`/`taken_at`/`exif` já existem no schema,
  preparadas e não populadas ainda (ver `docs/DATA-MODEL.md`).

## Talvez

- **Glyphs próprios para os labels do mapa** — hoje impossível com os glyphs
  que o MapTiler hospeda (Noto Sans e afins); exigiria gerar e servir um
  conjunto `.pbf` próprio, custo de infraestrutura hoje desproporcional ao
  ganho (ver `docs/MAP-STRATEGY.md` e `docs/DESIGN-SYSTEM.md`).
- **Migração para PostGIS**, conforme o gatilho registrado em
  [ADR 0004](./decisions/0004-sem-postgis-nesta-fase.md): o catálogo passar
  de alguns milhares de lugares, ou surgir necessidade de consulta por
  polígono que haversine não resolve.
- **Importação de lugares de fontes externas**, para além dos 14 lugares
  mockados hoje em `src/mocks/places.ts`.
- **Múltiplas motos com estatísticas comparadas** — o schema já suporta
  várias `motorcycles` por usuário; falta a leitura comparativa (km por
  moto).

## Fora de escopo declarado

Rede social, feed público, scraping, integração com Instagram, recomendação
por IA, tracking GPS em tempo real, app nativo, gamificação. Se uma proposta
recair em uma dessas categorias, ela provavelmente serve melhor ao Google
Maps — ou a outro produto — do que ao Rastro.
