-- Catálogo curado global — DADOS DE DESENVOLVIMENTO, NÃO VERIFICADOS.
--
-- `source = 'mock'` é preservado de propósito. O CLAUDE.md proíbe apresentar
-- dado de desenvolvimento como verificado, e apagar essa marca ao entrar no
-- banco seria a forma mais silenciosa possível de quebrar essa regra: as
-- coordenadas e descrições continuam aproximadas depois da migração.
--
-- `created_by = null` marca o lugar como do catálogo, não de um usuário. É o que
-- a interface lê para decidir que este lugar não pode ser editado nem apagado.
--
-- Idempotente: `on conflict (slug) do nothing`. Rodar de novo não duplica.
insert into public.places
  (slug, name, description, latitude, longitude, municipality,
   state_code, category, tags, source, created_by, is_public)
values
  ('serra-do-rio-do-rastro', 'Serra do Rio do Rastro',
   'Descida em curvas fechadas sobre o paredão, com mirante no alto da serra.',
   -28.39, -49.54, 'Bom Jardim da Serra', 'SC', 'serra',
   array['curvas','mirante','icônico'], 'mock', null, true),

  ('morro-da-igreja', 'Morro da Igreja',
   'Ponto habitado mais alto do sul do país, com a Pedra Furada.',
   -28.1247, -49.4736, 'Urubici', 'SC', 'mirante',
   array['altitude','frio'], 'mock', null, true),

  ('serra-do-corvo-branco', 'Serra do Corvo Branco',
   'Corte de rocha em paredões verticais ligando serra e litoral.',
   -28.17, -49.34, 'Grão-Pará', 'SC', 'serra',
   array['corte de rocha','estrada'], 'mock', null, true),

  ('urubici', 'Urubici',
   'Base da serra catarinense, ponto de apoio para a região alta.',
   -28.0154, -49.592, 'Urubici', 'SC', 'cidade',
   array['apoio','serra'], 'mock', null, true),

  ('cascata-do-avencal', 'Cascata do Avencal',
   'Queda alta em anfiteatro de rocha, próxima a Urubici.',
   -28.05, -49.5, 'Urubici', 'SC', 'cachoeira',
   array['cachoeira'], 'mock', null, true),

  ('guarda-do-embau', 'Guarda do Embaú',
   'Vila de surf na foz do rio da Madre, com travessia de barco.',
   -27.8967, -48.5828, 'Palhoça', 'SC', 'praia',
   array['surf','rio'], 'mock', null, true),

  ('praia-da-pinheira', 'Praia da Pinheira',
   'Faixa longa de areia entre costões, no sul da Grande Florianópolis.',
   -27.87, -48.59, 'Palhoça', 'SC', 'praia',
   array['costão'], 'mock', null, true),

  ('rancho-queimado', 'Rancho Queimado',
   'Cidade de altitude na serra do interior, clima ameno o ano todo.',
   -27.6717, -49.0164, 'Rancho Queimado', 'SC', 'cidade',
   array['altitude','bate-volta'], 'mock', null, true),

  ('santo-amaro-da-imperatriz', 'Santo Amaro da Imperatriz',
   'Vale de águas termais no pé da Serra do Tabuleiro.',
   -27.6875, -48.7789, 'Santo Amaro da Imperatriz', 'SC', 'natureza',
   array['termas','vale'], 'mock', null, true),

  ('garopaba', 'Garopaba',
   'Vila litorânea entre morros, com enseadas abrigadas.',
   -28.0272, -48.618, 'Garopaba', 'SC', 'praia',
   array['litoral','enseada'], 'mock', null, true),

  ('praia-do-rosa', 'Praia do Rosa',
   'Enseada em ferradura cercada por morros e lagoa.',
   -28.13, -48.64, 'Imbituba', 'SC', 'praia',
   array['enseada','baleias'], 'mock', null, true),

  ('lagoa-da-conceicao', 'Lagoa da Conceição',
   'Lagoa central da ilha, cercada por dunas e morros.',
   -27.6, -48.47, 'Florianópolis', 'SC', 'cidade',
   array['ilha','lagoa'], 'mock', null, true),

  ('morro-da-cruz', 'Mirante do Morro da Cruz',
   'Vista aberta sobre o centro de Florianópolis e as duas baías.',
   -27.59, -48.54, 'Florianópolis', 'SC', 'mirante',
   array['baías','urbano'], 'mock', null, true),

  ('serra-dona-francisca', 'Serra Dona Francisca',
   'Estrada de serra em mata atlântica ligando o litoral ao planalto.',
   -26.19, -49.05, 'Joinville', 'SC', 'estrada',
   array['mata atlântica','curvas'], 'mock', null, true)
on conflict (slug) do nothing;
