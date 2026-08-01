-- Visitante nao sobe fotografia.
--
-- A trava e do banco, e nao da interface. Esconder o controle de envio evita
-- OFERECER o que seria recusado; nao e o que recusa. Ver ADR 0008 e ADR 0017.
--
-- POLITICA RESTRITIVA, e nao mais uma permissiva: restritivas entram com AND
-- sobre as que ja existem, entao as regras de `fotos_insert_own` e `photos_own`
-- continuam valendo inteiras e nao precisam ser reescritas para ganhar uma
-- condicao.
--
-- O `coalesce` NAO e defensivo, e obrigatorio: para quem entrou pelo Google a
-- claim `is_anonymous` nao vem no JWT, `null = false` da `null`, e a politica
-- trata `null` como negacao. Sem ele, NINGUEM subiria foto.
--
-- As DUAS politicas, e nao so a do Storage: o envio grava o arquivo no bucket E
-- uma linha em `photos`. Barrar um lado so deixaria lixo pela metade -- arquivo
-- sem linha, ou linha apontando para arquivo que nao existe.
--
-- A tabela e `photos`, e nao `trip_photos`: a migration 0004 a renomeou, junto
-- com a politica `trip_photos_own`, que virou `photos_own`.

-- `bucket_id <> 'fotos' or ...` limita o alcance a este bucket. Uma restritiva
-- crua barraria o visitante em qualquer bucket futuro sem ninguem lembrar por
-- que -- e um bucket novo nasceria com uma regra que ninguem escreveu para ele.
drop policy if exists fotos_insert_nao_visitante on storage.objects;

create policy fotos_insert_nao_visitante on storage.objects
  as restrictive for insert
  with check (
    bucket_id <> 'fotos'
    or coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

drop policy if exists photos_insert_nao_visitante on photos;

create policy photos_insert_nao_visitante on photos
  as restrictive for insert
  with check (
    coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );
