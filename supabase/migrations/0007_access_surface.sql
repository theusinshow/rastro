-- Piso do acesso a um lugar: asfalto, terra, ou os dois no mesmo caminho.
--
-- Vive em `place_user_states`, e NÃO em `places`, por duas razões que se somam:
--
-- 1. A política `places_update` da 0001 só deixa alterar lugar que você criou
--    (`created_by = auth.uid()`). Os lugares curados do catálogo têm
--    `created_by` nulo, então uma coluna em `places` seria impossível de
--    preencher justamente na Serra do Corvo Branco e no Morro da Igreja — os
--    dois casos em que a pergunta "dá para ir de moto de rua?" mais importa.
--
-- 2. Piso não é um fato do lugar, é uma observação de quem foi lá. Estrada de
--    terra vira asfalto, asfalto vira buraco, e um trecho pode estar em obra.
--    Como declaração pessoal, o dado é honesto; como fato global, envelheceria
--    mentindo. É a mesma regra que impede apresentar coordenada de `src/mocks/`
--    como informação verificada.
--
-- NULO é o estado inicial de todos os lugares e significa "não sei" — nunca
-- "asfalto". Dizer asfalto sem saber é o erro que faz alguém sair de moto de rua
-- para pegar 12 km de chão.
create type place_access_surface as enum ('asfalto', 'terra', 'misto');

alter table place_user_states
  add column access_surface place_access_surface;

comment on column place_user_states.access_surface is
  'Piso do acesso, declarado por quem foi. Nulo = nao informado, nunca asfalto.';
