-- Bucket privado para as fotografias.
--
-- Foto de viagem carrega rosto, placa, e onde você estava e quando. Caminho
-- imprevisível NÃO é segurança: um link vazado vale para sempre e pode ser
-- indexado. A leitura acontece por URL assinada com validade curta.
insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', false)
on conflict (id) do nothing;

-- Cada usuário preso à própria pasta.
--
-- O caminho é {userId}/{placeId}/{uuid}.jpg, então o PRIMEIRO segmento é a
-- identidade — e é ele que a política compara. Mudar a ordem dos segmentos em
-- `buildStoragePath` quebraria a autorização sem nenhum erro aparecer.
create policy fotos_select_own on storage.objects
  for select using (
    bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy fotos_insert_own on storage.objects
  for insert with check (
    bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy fotos_delete_own on storage.objects
  for delete using (
    bucket_id = 'fotos' and (storage.foldername(name))[1] = auth.uid()::text
  );
