-- Catálogo curado — segunda leva, Santa Catarina.
--
-- O QUE ESTÁ VERIFICADO E O QUE NÃO ESTÁ, porque a diferença importa:
--
-- * **A coordenada está verificada.** Cada ponto veio da geocodificação do
--   MapTiler, o mesmo serviço que a aplicação usa, e cada um voltou como
--   `municipality` em Santa Catarina — não como rua homônima em outro estado,
--   que é o erro que essa consulta comete quando se aceita o primeiro
--   resultado sem olhar. É por isso que o `source` aqui é `imported`, e não
--   `mock`: ao contrário da primeira leva, estes pontos não são aproximados.
--
-- * **A descrição NÃO está verificada por quem esteve lá.** Ela é texto nosso,
--   escrito a partir de leitura, e descreve o que o lugar é — não promete
--   condição de estrada, horário nem preço. Nenhuma frase foi copiada de
--   lugar nenhum.
--
-- DE ONDE VEIO A LISTA. De uma curadoria de relatos de viagem de moto pelo Sul
-- (viagemdemoto.com), lida como **fonte de fatos**: que Lauro Müller fica no pé
-- da Serra do Rio do Rastro é fato, e fato não tem dono. Nenhuma foto e nenhum
-- texto de lá entrou aqui — as capas continuam vindo do Wikimedia Commons, com
-- autor e licença, pelo `scripts/fotos-de-capa.mjs`.
--
-- POR QUE ESTES SEIS. O catálogo estava concentrado no eixo Urubici–Grande
-- Florianópolis: catorze lugares, e nenhum no extremo sul, no litoral sul, no
-- alto do planalto ou no Vale do Itajaí. Cada um destes ancora uma região que
-- não tinha nada — não há sobreposição entre eles.
--
-- `created_by = null` marca o lugar como do catálogo, não de um usuário: é o
-- que a interface lê para decidir que ele não pode ser editado nem apagado.
--
-- Idempotente: `on conflict (slug) do nothing`. Rodar de novo não duplica.
insert into public.places
  (slug, name, description, latitude, longitude, municipality,
   state_code, category, tags, source, created_by, is_public)
values
  ('urupema', 'Urupema',
   'Ponto mais frio do país no inverno, no alto do planalto entre araucárias.',
   -27.9558, -49.8760, 'Urupema', 'SC', 'cidade',
   array['altitude','frio','araucária'], 'imported', null, true),

  ('sao-joaquim', 'São Joaquim',
   'Planalto de macieiras e invernos rigorosos, no alto da serra catarinense.',
   -28.2925, -49.9353, 'São Joaquim', 'SC', 'cidade',
   array['altitude','frio','planalto'], 'imported', null, true),

  -- O outro lado da serra que o catálogo já tinha: `serra-do-rio-do-rastro`
  -- está em -49.54 e Bom Jardim da Serra em -49.63, no alto. Lauro Müller fica
  -- em -49.40, a leste — é onde a subida começa, vindo do litoral.
  ('lauro-muller', 'Lauro Müller',
   'Pé da Serra do Rio do Rastro pelo lado do litoral, onde a subida começa.',
   -28.3942, -49.3975, 'Lauro Müller', 'SC', 'cidade',
   array['serra','apoio'], 'imported', null, true),

  ('praia-grande', 'Praia Grande',
   'Base catarinense dos cânions dos Aparados da Serra, no extremo sul do estado.',
   -29.1971, -49.9504, 'Praia Grande', 'SC', 'cidade',
   array['cânions','extremo sul','apoio'], 'imported', null, true),

  ('laguna', 'Laguna',
   'Centro histórico à beira da laguna, onde os botos pescam junto com os pescadores.',
   -28.4837, -48.7817, 'Laguna', 'SC', 'cidade',
   array['histórico','botos','litoral sul'], 'imported', null, true),

  ('pomerode', 'Pomerode',
   'Arquitetura enxaimel e herança alemã no Vale do Itajaí, no norte do estado.',
   -26.7356, -49.1770, 'Pomerode', 'SC', 'cidade',
   array['enxaimel','vale do itajaí'], 'imported', null, true)
on conflict (slug) do nothing;
