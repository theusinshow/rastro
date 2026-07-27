-- Rastro — schema inicial
--
-- Princípio: catálogo de lugares (fato compartilhável) separado de estado
-- pessoal (opinião) e de visitas (evento datado). Ver ADR 0003.
--
-- Toda tabela com dado pessoal carrega user_id e tem RLS ativa desde já, mesmo
-- havendo um único usuário. Adicionar multiusuário depois vira uma questão de
-- autenticação, não de migração de dados.

-- ---------------------------------------------------------------- enums

create type place_category as enum (
  'serra', 'praia', 'mirante', 'natureza', 'cachoeira',
  'estrada', 'cidade', 'cafe', 'restaurante', 'ponto_turistico'
);

create type place_source as enum ('mock', 'manual', 'imported');

create type trip_status as enum ('planned', 'ongoing', 'completed');

create type trip_stop_kind as enum (
  'start', 'waypoint', 'destination', 'fuel', 'meal'
);

-- ---------------------------------------------------------------- profiles

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  home_label text,
  home_latitude double precision,
  home_longitude double precision,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- motorcycles

create table motorcycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  make text not null,
  model text not null,
  year smallint,
  nickname text,
  odometer_km integer,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index motorcycles_user_id_idx on motorcycles (user_id);

-- Uma única moto padrão por usuário. Índice parcial em vez de trigger.
create unique index motorcycles_one_default_per_user
  on motorcycles (user_id) where is_default;

-- ---------------------------------------------------------------- places

-- Catálogo. Fato objetivo, compartilhável.
--
-- Não há coluna de distância nem de tempo estimado: ambos dependem da origem de
-- quem consulta e são calculados em tempo de leitura.
create table places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  municipality text,
  state_code text not null default 'SC',
  country_code text not null default 'BR',
  category place_category not null,
  tags text[] not null default '{}',
  cover_image_url text,
  source place_source not null default 'manual',
  -- NULL indica lugar curado, pertencente ao catálogo global.
  created_by uuid references auth.users on delete set null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint places_latitude_range check (latitude between -90 and 90),
  constraint places_longitude_range check (longitude between -180 and 180)
);

create index places_category_idx on places (category);
create index places_created_by_idx on places (created_by);
-- Índice de apoio para recortes por caixa envolvente antes do haversine.
create index places_lat_lng_idx on places (latitude, longitude);

-- ---------------------------------------------------------------- visits

-- Evento. A verdade sobre "já estive lá" vive aqui, não num booleano.
create table place_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  place_id uuid not null references places on delete cascade,
  trip_id uuid,
  visited_at date not null,
  -- Como foi ESTA visita, distinto da opinião geral sobre o lugar.
  rating smallint check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create index place_visits_user_place_idx on place_visits (user_id, place_id);
create index place_visits_visited_at_idx on place_visits (user_id, visited_at desc);

-- ---------------------------------------------------------------- user state

-- Vínculo usuário ↔ lugar. Substitui a tabela `favorites` do rascunho: favorito
-- é atributo deste vínculo, não entidade. Ver ADR 0003.
create table place_user_states (
  user_id uuid not null references auth.users on delete cascade,
  place_id uuid not null references places on delete cascade,
  is_favorite boolean not null default false,
  wants_to_visit boolean not null default false,
  personal_notes text,
  -- Opinião geral e atual sobre o lugar.
  rating smallint check (rating between 1 and 5),
  -- Colunas derivadas de place_visits, mantidas pelo trigger abaixo.
  first_visited_at date,
  last_visited_at date,
  visit_count integer not null default 0,
  photo_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create index place_user_states_favorites_idx
  on place_user_states (user_id) where is_favorite;

-- ---------------------------------------------------------------- trips

create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  motorcycle_id uuid references motorcycles on delete set null,
  title text not null,
  slug text not null,
  status trip_status not null default 'planned',
  started_at timestamptz,
  ended_at timestamptz,
  origin_label text,
  origin_latitude double precision,
  origin_longitude double precision,
  primary_place_id uuid references places on delete set null,
  distance_km numeric(8, 2),
  duration_minutes integer,
  -- Avaliação da viagem como um todo.
  rating smallint check (rating between 1 and 5),
  notes text,
  -- Traçado como GeoJSON. Sem tipo geométrico dedicado. Ver ADR 0004.
  route_geojson jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index trips_user_started_idx on trips (user_id, started_at desc);
create index trips_status_idx on trips (user_id, status);

alter table place_visits
  add constraint place_visits_trip_id_fkey
  foreign key (trip_id) references trips on delete set null;

-- ---------------------------------------------------------------- trip stops

create table trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  place_id uuid references places on delete set null,
  order_index smallint not null,
  label text not null,
  latitude double precision,
  longitude double precision,
  kind trip_stop_kind not null default 'waypoint',
  arrived_at timestamptz,
  notes text,
  unique (trip_id, order_index)
);

create index trip_stops_trip_idx on trip_stops (trip_id, order_index);

-- ---------------------------------------------------------------- trip photos

-- latitude, longitude e taken_at existem desde já para receber EXIF. Nenhuma
-- leitura de EXIF é implementada nesta fase.
create table trip_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  place_id uuid references places on delete set null,
  storage_path text not null,
  width integer,
  height integer,
  latitude double precision,
  longitude double precision,
  taken_at timestamptz,
  caption text,
  exif jsonb,
  sort_index smallint not null default 0,
  created_at timestamptz not null default now()
);

create index trip_photos_trip_idx on trip_photos (trip_id, sort_index);
create index trip_photos_place_idx on trip_photos (place_id);
-- Suporta posicionar fotos no mapa quando houver coordenada.
create index trip_photos_located_idx
  on trip_photos (user_id) where latitude is not null;

-- ------------------------------------------------- derivação de visitas

-- Mantém place_user_states em dia a partir de place_visits. As colunas
-- derivadas existem por desempenho de leitura do mapa; a verdade continua
-- sendo a tabela de eventos.
create or replace function refresh_place_user_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid := coalesce(new.user_id, old.user_id);
  target_place uuid := coalesce(new.place_id, old.place_id);
begin
  insert into place_user_states (user_id, place_id)
  values (target_user, target_place)
  on conflict (user_id, place_id) do nothing;

  update place_user_states s
  set
    visit_count = agg.total,
    first_visited_at = agg.first_at,
    last_visited_at = agg.last_at,
    updated_at = now()
  from (
    select
      count(*) as total,
      min(visited_at) as first_at,
      max(visited_at) as last_at
    from place_visits
    where user_id = target_user and place_id = target_place
  ) agg
  where s.user_id = target_user and s.place_id = target_place;

  return null;
end;
$$;

create trigger place_visits_refresh_state
after insert or update or delete on place_visits
for each row execute function refresh_place_user_state();

-- ---------------------------------------------------------------- RLS

alter table profiles           enable row level security;
alter table motorcycles        enable row level security;
alter table places             enable row level security;
alter table place_visits       enable row level security;
alter table place_user_states  enable row level security;
alter table trips              enable row level security;
alter table trip_stops         enable row level security;
alter table trip_photos        enable row level security;

create policy profiles_own on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy motorcycles_own on motorcycles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy place_visits_own on place_visits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy place_user_states_own on place_user_states
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy trips_own on trips
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy trip_photos_own on trip_photos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- trip_stops não tem user_id próprio: a posse é herdada da viagem.
create policy trip_stops_via_trip on trip_stops
  for all
  using (exists (
    select 1 from trips t where t.id = trip_stops.trip_id and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from trips t where t.id = trip_stops.trip_id and t.user_id = auth.uid()
  ));

-- Catálogo: leitura do que é público ou próprio; escrita apenas do próprio.
create policy places_read on places
  for select using (is_public or created_by = auth.uid());

create policy places_insert on places
  for insert with check (created_by = auth.uid());

create policy places_update on places
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy places_delete on places
  for delete using (created_by = auth.uid());
