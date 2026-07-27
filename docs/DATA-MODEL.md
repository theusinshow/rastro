# Modelo de dados do Rastro

Este documento descreve o schema definido em
`supabase/migrations/0001_initial_schema.sql`: as oito tabelas, seus
relacionamentos, as decisões que não são óbvias olhando só para o SQL, e o
mapeamento entre os tipos de `src/domain/` e as colunas do banco.

O princípio central está registrado em ADR 0003: **catálogo de lugares (fato
compartilhável) separado de estado pessoal (opinião) e de visitas (evento
datado)**. "Visitado" não é um booleano — é *existe ao menos uma visita*.

Toda tabela com dado pessoal carrega `user_id` (ou herda a posse por FK) e tem
RLS ativa desde já, mesmo havendo hoje um único usuário. Isso torna adicionar
autenticação multiusuário, no futuro, uma questão de autenticação — não uma
migração de dados.

---

## Diagrama de relações

```
auth.users (Supabase Auth — fora deste schema)
  │
  ├─ 1:1 ── profiles
  │
  ├─ 1:N ── motorcycles
  │            │
  │            └─ 1:N ── trips (motorcycle_id, opcional)
  │
  ├─ 1:N ── places (created_by, opcional — NULL = lugar curado do catálogo)
  │
  ├─ 1:N ── place_visits
  ├─ 1:N ── place_user_states
  ├─ 1:N ── trips
  └─ 1:N ── trip_photos

places
  ├─ 1:N ── place_visits          (place_id)
  ├─ 1:N ── place_user_states     (place_id — ver nota abaixo)
  ├─ 1:N ── trips                 (primary_place_id, opcional)
  ├─ 1:N ── trip_stops            (place_id, opcional)
  └─ 1:N ── trip_photos           (place_id, opcional)

trips
  ├─ 1:N ── trip_stops            (trip_id, cascade)
  ├─ 1:N ── trip_photos           (trip_id, cascade)
  └─ 1:N ── place_visits          (trip_id, opcional — set null ao apagar a viagem)
```

`place_user_states` tem chave primária composta `(user_id, place_id)`: na
prática resolve um relacionamento N:N entre usuários e lugares, mas carrega
atributos próprios (favorito, nota, cache de visitas) — por isso é tratada como
tabela de estado, não como mera tabela de junção.

---

## As oito tabelas

### `profiles`

Um por usuário (`id` é a própria FK para `auth.users`, em cascade). Guarda
preferências de perfil: nome de exibição e uma localização de "casa"
(`home_label`, `home_latitude`, `home_longitude`) usada como origem padrão para
distância e descoberta quando o usuário não fornece outra.

### `motorcycles`

Motos do usuário. `is_default` marca a moto usada por padrão ao criar uma
viagem. A unicidade de "uma moto padrão por usuário" é garantida por um índice
único **parcial** (`motorcycles_one_default_per_user`, `where is_default`) em
vez de um trigger — mais simples e o Postgres já garante a invariante.
`odometer_km` é o odômetro conhecido da moto, não recalculado a partir de
viagens.

### `places`

O catálogo. Fato objetivo e compartilhável — nome, coordenadas, categoria,
município. Não contém nada de opinião pessoal: isso vive em
`place_user_states` e `place_visits` (ADR 0003).

Colunas não óbvias:

- `created_by` **nulo** significa lugar curado, pertencente ao catálogo
  global (não pertence a nenhum usuário específico). Não-nulo significa que
  aquele usuário cadastrou o lugar.
- `is_public` controla se outros usuários podem ler o lugar (ver seção RLS).
- Não há coluna de distância nem de tempo estimado até o lugar: ambos
  dependem de qual é a origem de quem consulta, e são calculados em tempo de
  leitura por `src/domain/geo.ts` — nunca persistidos.
- `places_lat_lng_idx` existe para recortar por caixa envolvente antes de
  aplicar haversine, e não para substituir o cálculo (ver ADR 0004).

### `place_visits`

O evento. Cada linha é uma visita real e datada a um lugar. É aqui, e só aqui,
que mora a verdade sobre "já estive lá" — não existe `is_visited` em lugar
nenhum do schema. Um mesmo lugar pode ter múltiplas visitas, cada uma com sua
própria data, nota e observações.

`trip_id` é opcional e nulo quando a visita não está associada a uma viagem
registrada (ex.: visita antiga, sem viagem no sistema). A FK para `trips` é
adicionada por um `alter table` posterior no arquivo de migração, porque
`trips` só é criada depois de `place_visits` — não há como referenciar uma
tabela que ainda não existe no momento da criação de `place_visits`.

### `place_user_states`

O vínculo usuário↔lugar. Substitui a tabela `favorites` do rascunho inicial:
favorito é um atributo deste vínculo (`is_favorite`), não uma entidade própria
(ADR 0003).

Colunas não óbvias:

- `wants_to_visit` é a intenção declarada de conhecer o lugar.
- `rating` aqui é a opinião geral e **atual** sobre o lugar — distinta da nota
  de uma visita específica (ver tabela de `rating`s abaixo).
- `first_visited_at`, `last_visited_at`, `visit_count` são **cache derivado**
  de `place_visits`, mantido pelo trigger `place_visits_refresh_state` — nunca
  escrito diretamente pela aplicação (ver seção de derivação abaixo).
- `photo_count` também é cache, mas mantido de forma diferente: nesta
  migração, nenhum trigger o atualiza a partir de `trip_photos` — fica como
  contrato para uma iteração futura, e não deve ser lido como garantidamente
  sincronizado ainda.

### `trips`

Uma viagem planejada, em andamento ou concluída. `motorcycle_id` e
`primary_place_id` são opcionais (`on delete set null`): apagar a moto ou o
lugar não apaga a viagem.

Colunas não óbvias:

- `rating` aqui avalia a viagem **como um todo**, distinta da nota de um lugar
  específico visitado durante ela (ver tabela de `rating`s abaixo).
- `route_geojson jsonb` guarda o traçado da viagem como GeoJSON, deliberadamente
  sem tipo geométrico dedicado do Postgres (ADR 0004).
- `slug` é único por usuário (`unique (user_id, slug)`), não globalmente —
  cada usuário tem seu próprio espaço de slugs de viagem.

### `trip_stops`

Pontos de parada de uma viagem, ordenados por `order_index` (único por
viagem). `place_id` é opcional: uma parada pode não corresponder a um lugar do
catálogo (ex.: um posto de gasolina qualquer). `kind` distingue início,
waypoint, destino, abastecimento e refeição.

Não tem `user_id` próprio — a posse é inteiramente herdada de `trips` via
`trip_id` (ver seção RLS).

### `trip_photos`

Fotos associadas a uma viagem. `latitude`, `longitude` e `taken_at` existem
desde já para receber metadados EXIF — nenhuma leitura de EXIF é implementada
nesta fase; são colunas preparadas, não populadas automaticamente ainda.
`exif jsonb` guarda o bloco bruto de metadados, quando disponível, para uso
futuro sem precisar de nova migração.

---

## Os três campos `rating`

Não é duplicação — cada um mede algo diferente, em uma granularidade
diferente:

| Coluna | O que mede |
|---|---|
| `place_visits.rating` | Como foi **aquela visita específica**, numa data específica. Um mesmo lugar pode ter visitas com notas diferentes. |
| `place_user_states.rating` | A opinião **geral e atual** sobre o lugar, independente de quando ou quantas vezes foi visitado. |
| `trips.rating` | A avaliação da **viagem inteira**, que pode incluir múltiplos lugares, paradas e quilômetros — não é a nota de um lugar específico. |

Todos são `smallint check (rating between 1 and 5)`, mas cada um vive em uma
tabela porque respondem perguntas diferentes: "como foi ir à cachoeira em
março?" (visita), "eu gosto desse lugar?" (estado) e "essa viagem valeu a
pena?" (viagem).

---

## Colunas derivadas e o trigger de visitas

`place_user_states.visit_count`, `first_visited_at` e `last_visited_at` não
são escritas pela aplicação. Elas existem por **desempenho de leitura**: o
mapa do Explore precisa saber, para cada lugar, quantas vezes e quando foi
visitado, sem rodar `count()`/`min()`/`max()` sobre `place_visits` a cada
render.

A função `refresh_place_user_state()`, disparada pelo trigger
`place_visits_refresh_state` (`after insert or update or delete on
place_visits`), recalcula essas três colunas para o par `(user_id, place_id)`
afetado, a cada mudança em `place_visits`:

1. Garante que existe uma linha em `place_user_states` para o par
   (`insert ... on conflict do nothing`) — uma visita pode ser a primeira
   interação do usuário com aquele lugar.
2. Reagrega `place_visits` para aquele par e atualiza `visit_count`,
   `first_visited_at`, `last_visited_at` e `updated_at`.

A verdade sobre visitas **permanece inteiramente em `place_visits`**. As
colunas derivadas são um cache que pode, em teoria, ser reconstruído do zero a
qualquer momento reprocessando `place_visits` — nunca a fonte da informação.
Consequência prática: nenhum código de aplicação deve fazer `update` direto
nessas três colunas.

---

## Mapeamento `camelCase` (domínio) → `snake_case` (banco)

Verificado linha a linha contra `src/domain/place.ts`, `motorcycle.ts` e
`trip.ts`.

### `Place` → `places`

| Domínio (`src/domain/place.ts`) | Banco (`places`) |
|---|---|
| `id` | `id` |
| `slug` | `slug` |
| `name` | `name` |
| `description` | `description` |
| `latitude` | `latitude` |
| `longitude` | `longitude` |
| `municipality` | `municipality` |
| `stateCode` | `state_code` |
| `category` | `category` |
| `tags` | `tags` |
| `coverImageUrl` | `cover_image_url` |
| `source` | `source` |
| *(não modelado no domínio)* | `country_code`, `created_by`, `is_public`, `created_at`, `updated_at` |

As colunas só-de-banco existem porque o schema já é multiusuário; o domínio,
hoje, só precisa da leitura de um catálogo já filtrado por RLS.

### `PlaceUserState` → `place_user_states`

| Domínio (`src/domain/place.ts`) | Banco (`place_user_states`) |
|---|---|
| `placeId` | `place_id` |
| `isFavorite` | `is_favorite` |
| `wantsToVisit` | `wants_to_visit` |
| `personalNotes` | `personal_notes` |
| `rating` | `rating` |
| `lastVisitedAt` | `last_visited_at` |
| `visitCount` | `visit_count` |
| `photoCount` | `photo_count` |
| *(não modelado no domínio)* | `user_id`, `first_visited_at`, `created_at`, `updated_at` |

`userId` não aparece no domínio porque o app é de único usuário por sessão
hoje — o repositório mock já assume o usuário implícito. `first_visited_at`
existe no banco e ainda não foi exposto ao domínio.

### `Motorcycle` → `motorcycles`

| Domínio (`src/domain/motorcycle.ts`) | Banco (`motorcycles`) |
|---|---|
| `id` | `id` |
| `userId` | `user_id` |
| `make` | `make` |
| `model` | `model` |
| `year` | `year` |
| `nickname` | `nickname` |
| `isDefault` | `is_default` |
| `odometerKm` | `odometer_km` |
| *(não modelado no domínio)* | `created_at` |

### `Trip` → `trips`

| Domínio (`src/domain/trip.ts`) | Banco (`trips`) |
|---|---|
| `id` | `id` |
| `userId` | `user_id` |
| `motorcycleId` | `motorcycle_id` |
| `title` | `title` |
| `slug` | `slug` |
| `status` | `status` |
| `startedAt` | `started_at` |
| `endedAt` | `ended_at` |
| `originLabel` | `origin_label` |
| `originCoordinates.latitude` | `origin_latitude` |
| `originCoordinates.longitude` | `origin_longitude` |
| `primaryPlaceId` | `primary_place_id` |
| `distanceKm` | `distance_km` |
| `durationMinutes` | `duration_minutes` |
| `rating` | `rating` |
| `notes` | `notes` |
| *(não modelado no domínio)* | `route_geojson`, `created_at`, `updated_at` |

`originCoordinates`, um objeto `Coordinates` único no domínio, corresponde a
duas colunas escalares no banco (`origin_latitude`, `origin_longitude`) — o
mesmo padrão usado em `TripStop.coordinates` e `TripPhoto.coordinates` abaixo.

### `TripStop` → `trip_stops`

| Domínio (`src/domain/trip.ts`) | Banco (`trip_stops`) |
|---|---|
| `id` | `id` |
| `tripId` | `trip_id` |
| `placeId` | `place_id` |
| `orderIndex` | `order_index` |
| `label` | `label` |
| `coordinates.latitude` | `latitude` |
| `coordinates.longitude` | `longitude` |
| `kind` | `kind` |
| `arrivedAt` | `arrived_at` |
| `notes` | `notes` |

### `TripPhoto` → `trip_photos`

| Domínio (`src/domain/trip.ts`) | Banco (`trip_photos`) |
|---|---|
| `id` | `id` |
| `tripId` | `trip_id` |
| `userId` | `user_id` |
| `placeId` | `place_id` |
| `storagePath` | `storage_path` |
| `width` | `width` |
| `height` | `height` |
| `coordinates.latitude` | `latitude` |
| `coordinates.longitude` | `longitude` |
| `takenAt` | `taken_at` |
| `caption` | `caption` |
| `sortIndex` | `sort_index` |
| *(não modelado no domínio)* | `exif`, `created_at` |

### `place_visits` — sem tipo de domínio ainda

`place_visits` não tem um tipo correspondente em `src/domain/` nesta tarefa;
suas colunas (`user_id`, `place_id`, `trip_id`, `visited_at`, `rating`,
`notes`, `created_at`) seguem a mesma convenção `snake_case` das demais
tabelas e serão modeladas no domínio quando a funcionalidade de registrar
visitas for implementada.

---

## Estratégia de RLS

Toda tabela com dado pessoal tem `row level security` habilitada desde a
migração inicial, mesmo com um único usuário hoje — a política de acesso já
é a política multiusuário final.

- **Tabelas de posse direta** (`profiles`, `motorcycles`, `place_visits`,
  `place_user_states`, `trips`, `trip_photos`): a política compara
  `user_id = auth.uid()` (ou `id = auth.uid()`, em `profiles`) tanto para
  leitura quanto escrita — `for all using (...) with check (...)`.
- **`trip_stops` não tem `user_id` próprio.** A posse é herdada de `trips`: a
  política (`trip_stops_via_trip`) verifica, via subconsulta `exists`, que a
  viagem referenciada por `trip_id` pertence ao usuário autenticado.
- **`places` é o catálogo compartilhado**, e por isso tem uma estratégia
  diferente das demais — quatro políticas, uma por operação:
  - `places_read` (select): permite ler lugares públicos (`is_public`) **ou**
    lugares criados pelo próprio usuário (`created_by = auth.uid()`), mesmo
    que não públicos.
  - `places_insert`, `places_update`, `places_delete`: exigem
    `created_by = auth.uid()` — só se edita ou apaga o que se criou. Lugares
    curados (`created_by is null`) não são editáveis por ninguém via essas
    políticas.

---

## Perguntas que o schema já responde

Estatísticas futuras do produto e a consulta correspondente, em linguagem
natural:

- **Km viajados e maior viagem** — agregação (`sum`, `max`) de
  `trips.distance_km` para o usuário, opcionalmente filtrando por `status =
  'completed'`.
- **Lugares e municípios visitados** — junção de `place_visits` com
  `places.municipality` (via `place_id`), contando lugares e municípios
  distintos por usuário.
- **Mês com mais viagens** — `date_trunc('month', trips.started_at)` agrupado
  e contado, para o usuário.
- **Km por moto** — `trips` agrupado por `motorcycle_id`, somando
  `distance_km`, para comparar o uso de cada moto.
- **Timeline de Memórias** — `trips` com `status = 'completed'`, ordenado por
  `started_at desc`, cada viagem trazendo consigo suas `trip_stops` e
  `trip_photos` associadas.
