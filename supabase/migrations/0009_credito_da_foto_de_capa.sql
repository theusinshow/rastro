-- Credito da foto de capa.
--
-- `cover_image_url` existia sozinho desde a 0001, e sozinho ele nao serve: as
-- fotos do Wikimedia Commons sao CC BY ou CC BY-SA, e as duas licencas OBRIGAM
-- atribuir o autor. Publicar a foto sem o credito nao e descuido de interface,
-- e descumprir a condicao sob a qual a foto foi liberada.
--
-- Tres colunas e nao uma: o nome de quem fez, a licenca sob a qual esta, e o
-- endereco da pagina de origem. Guardar so uma frase pronta pareceria mais
-- simples e envelheceria mal -- a interface precisa poder ligar o nome ao
-- arquivo, e a licenca tem nome proprio que muda o que se pode fazer.
--
-- Todas aceitam nulo: foto propria, subida pelo dono do lugar, nao tem credito
-- de terceiro para dar. Nulo aqui significa "nao ha credito a exibir", nunca
-- "credito desconhecido".
alter table places
  add column cover_image_author  text,
  add column cover_image_license text,
  add column cover_image_source  text;

comment on column places.cover_image_author is
  'Autor da foto de capa. Nulo quando a foto e propria ou nao ha capa.';
comment on column places.cover_image_license is
  'Nome curto da licenca, ex.: CC BY-SA 4.0. Exigida quando ha autor.';
comment on column places.cover_image_source is
  'Pagina de origem da foto, para o credito poder apontar para ela.';
