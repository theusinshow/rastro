-- Fotos passam a pertencer ao LUGAR, com a viagem opcional.
--
-- O esquema original se contradizia: place_visits.trip_id aceita nulo e
-- trip_photos.trip_id não. O produto deixava registrar "estive aqui" sem viagem,
-- mas não anexar a foto tirada lá sem inventar uma — e isso excluiria toda
-- fotografia anterior ao próprio aplicativo.

alter table trip_photos rename to photos;

alter table photos alter column trip_id  drop not null;
alter table photos alter column place_id set not null;

-- OBRIGATÓRIO junto com o `set not null` acima. `place_id` era
-- `on delete set null`, e as duas coisas se contradizem: apagar um lugar
-- tentaria escrever nulo numa coluna que não aceita nulo, e a exclusão falharia.
--
-- `cascade` é a mesma escolha de place_visits.place_id: se o lugar deixa de
-- existir, a memória dele vai junto.
--
-- O nome da constraint continua com o prefixo antigo de propósito: renomear a
-- tabela não renomeia constraint, e este é o nome que o Postgres criou.
alter table photos drop constraint trip_photos_place_id_fkey;
alter table photos add  constraint photos_place_id_fkey
  foreign key (place_id) references places on delete cascade;

-- Sempre conhecidas: saem do canvas no próprio upload. Nulas quebrariam a
-- reserva de proporção da grade, que é o que substitui o skeleton proibido.
alter table photos alter column width  set not null;
alter table photos alter column height set not null;

-- Data civil, não instante: a memória é do dia. Mesma escolha de
-- place_visits.visited_at.
alter table photos rename column taken_at to taken_on;
alter table photos alter column taken_on type date using taken_on::date;
-- Continua aceitando nulo DE PROPÓSITO: nulo é "não sabemos quando foi tirada".
-- Preenchê-la com o dia do upload seria inventar memória.

-- Coluna que nunca seria escrita: extraímos GPS e data para colunas tipadas, e o
-- bloco bruto carrega número de série do aparelho e mais dado pessoal do que
-- precisamos guardar. Manter coluna que ninguém preenche é a armadilha que já
-- custou o photo_count.
alter table photos drop column exif;

alter index trip_photos_trip_idx    rename to photos_trip_idx;
alter index trip_photos_place_idx   rename to photos_place_idx;
alter index trip_photos_located_idx rename to photos_located_idx;

alter policy trip_photos_own on photos rename to photos_own;

-- ------------------------------------------------- derivação de fotos

-- Mantém place_user_states.photo_count a partir de photos. Espelha
-- refresh_place_user_state(), que faz o mesmo para visitas.
--
-- Até aqui NADA mantinha photo_count: ele nascia zero e morria zero, e por isso a
-- camada `photoDot` do mapa esteve apagada desde sempre.
--
-- `security definer` aqui, e `security invoker` na complete_trip da 0003: a
-- diferença é deliberada. A complete_trip é chamada PELO usuário e a RLS precisa
-- decidir se ele pode; um trigger roda como efeito de uma escrita que a RLS já
-- autorizou, e só mantém cache derivado.
create or replace function refresh_place_photo_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user  uuid := coalesce(new.user_id, old.user_id);
  target_place uuid := coalesce(new.place_id, old.place_id);
begin
  insert into place_user_states (user_id, place_id)
  values (target_user, target_place)
  on conflict (user_id, place_id) do nothing;

  update place_user_states s
     set photo_count = (
           select count(*) from photos
            where user_id = target_user and place_id = target_place
         ),
         updated_at = now()
   where s.user_id = target_user and s.place_id = target_place;

  return null;
end;
$$;

create trigger photos_refresh_count
after insert or update or delete on photos
for each row execute function refresh_place_photo_count();

comment on table photos is
  'Fotografias de um lugar. trip_id e opcional: foto anterior ao app nao tem viagem.';
