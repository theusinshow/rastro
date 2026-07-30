-- Conclui uma viagem e registra visita nas paradas confirmadas, atomicamente.
--
-- Existe como função, e não como duas chamadas do aplicativo, porque a escrita
-- toca DUAS tabelas: `trips` (status e ended_at) e `place_visits` (uma linha por
-- parada confirmada). Em dois `await` separados, uma falha no meio deixaria o
-- banco mentindo de forma VISÍVEL — é o registro de visita que pinta o pin de
-- verde no mapa, então a inconsistência apareceria na tela.
--
-- `security invoker` é deliberado: a RLS continua valendo DENTRO da função, e o
-- banco segue sendo a única autoridade de autorização (ADR 0008). Com
-- `security definer` esta função passaria por cima das políticas e viraria um
-- buraco pelo qual um usuário concluiria a viagem de outro.
create or replace function complete_trip(
  p_trip_id uuid,
  p_confirmed_stop_ids uuid[],
  p_visited_at date
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_updated integer;
begin
  update trips
     set status = 'completed',
         ended_at = coalesce(ended_at, now()),
         updated_at = now()
   where id = p_trip_id;

  get diagnostics v_updated = row_count;

  -- Zero linhas significa que a RLS recusou, ou que a viagem não existe. Falhar
  -- aqui evita gravar visita órfã numa viagem que não é de quem pediu.
  if v_updated = 0 then
    raise exception 'viagem nao encontrada ou sem permissao';
  end if;

  -- Marca as paradas que aconteceram. As não confirmadas ficam com arrived_at
  -- nulo: o roteiro planejado permanece registrado, e a memória diz só o que de
  -- fato houve.
  update trip_stops
     set arrived_at = p_visited_at
   where trip_id = p_trip_id
     and id = any(p_confirmed_stop_ids);

  -- Só parada confirmada E ligada ao catálogo vira visita. Parada solta
  -- (combustível, almoço) não é lugar e não entra na memória do mapa.
  --
  -- O `not exists` torna a chamada idempotente: concluir duas vezes não duplica
  -- a visita, e o trigger de visit_count não conta duas passagens onde houve uma.
  insert into place_visits (user_id, place_id, trip_id, visited_at)
  select s.trip_owner, s.place_id, p_trip_id, p_visited_at
    from (
      select t.user_id as trip_owner, ts.place_id
        from trip_stops ts
        join trips t on t.id = ts.trip_id
       where ts.trip_id = p_trip_id
         and ts.id = any(p_confirmed_stop_ids)
         and ts.place_id is not null
    ) s
   where not exists (
     select 1 from place_visits pv
      where pv.trip_id = p_trip_id
        and pv.place_id = s.place_id
   );
end;
$$;

comment on function complete_trip is
  'Conclui viagem e registra visitas confirmadas numa transacao. security invoker: a RLS decide.';
