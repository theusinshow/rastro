-- Fotos de capa do Wikimedia Commons.
--
-- GERADO por scripts/fotos-de-capa.mjs. Nao editar a mao: rode o script de novo.
--
-- Cada foto vem com autor, licenca e pagina de origem porque CC BY e CC BY-SA
-- OBRIGAM atribuir. Lugar sem credito completo foi descartado pelo script --
-- sem poder creditar, nao ha permissao para publicar.
--
-- 10 de 14 lugares com foto. 0 descartado(s) por credito incompleto.

update places as p set
  cover_image_url     = novo.url,
  cover_image_author  = novo.autor,
  cover_image_license = novo.licenca,
  cover_image_source  = novo.origem
from (values
  ('cascata-do-avencal', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Cascata_do_Avencal_-_Urubici_-_Brasil_%2846134213575%29.jpg/1920px-Cascata_do_Avencal_-_Urubici_-_Brasil_%2846134213575%29.jpg', 'Rosanetur from Rio de Janeiro, Brazil', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Cascata_do_Avencal_-_Urubici_-_Brasil_(46134213575).jpg'),
  ('garopaba', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Rua_dos_Pres%C3%A9pios_-_Garopaba%2C_17.12.2025_03.jpg/1920px-Rua_dos_Pres%C3%A9pios_-_Garopaba%2C_17.12.2025_03.jpg', 'Parzeus', 'CC BY 4.0', 'https://commons.wikimedia.org/wiki/File:Rua_dos_Pres%C3%A9pios_-_Garopaba,_17.12.2025_03.jpg'),
  ('guarda-do-embau', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Guarda_do_Emba%C3%BA%2C_Santa_Catarina%2C_Brasil.jpg/1920px-Guarda_do_Emba%C3%BA%2C_Santa_Catarina%2C_Brasil.jpg', 'Rodrigo Soldon', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Guarda_do_Emba%C3%BA,_Santa_Catarina,_Brasil.jpg'),
  ('lagoa-da-conceicao', 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Lagoa_da_Concei%C3%A7%C3%A3o_-_Florian%C3%B3polis_%281%29.jpg/1920px-Lagoa_da_Concei%C3%A7%C3%A3o_-_Florian%C3%B3polis_%281%29.jpg', 'Rodrigo.Argenton', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Lagoa_da_Concei%C3%A7%C3%A3o_-_Florian%C3%B3polis_(1).jpg'),
  ('morro-da-cruz', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Florian%C3%B3polis_SC_Brasil_-_Vista_do_Centro_Mirante_Morro_da_Cruz_-_panoramio.jpg/1920px-Florian%C3%B3polis_SC_Brasil_-_Vista_do_Centro_Mirante_Morro_da_Cruz_-_panoramio.jpg', 'Josue Marinho', 'CC BY 3.0', 'https://commons.wikimedia.org/wiki/File:Florian%C3%B3polis_SC_Brasil_-_Vista_do_Centro_Mirante_Morro_da_Cruz_-_panoramio.jpg'),
  ('morro-da-igreja', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/MORRO_DA_IGREJA%2C_NA_SERRA_DO_CORVO_BRANCO_EM_URUBICI-SC%2C_BRAZIL_05.jpg/1920px-MORRO_DA_IGREJA%2C_NA_SERRA_DO_CORVO_BRANCO_EM_URUBICI-SC%2C_BRAZIL_05.jpg', 'EDI GALVANI ULIANO', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:MORRO_DA_IGREJA,_NA_SERRA_DO_CORVO_BRANCO_EM_URUBICI-SC,_BRAZIL_05.jpg'),
  ('praia-da-pinheira', 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Praia_da_Pinheira_%2814729183250%29.jpg/1920px-Praia_da_Pinheira_%2814729183250%29.jpg', 'Otávio Nogueira from Fortaleza, BR', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Praia_da_Pinheira_(14729183250).jpg'),
  ('praia-do-rosa', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Praia_do_Rosa_%2815666905785%29.jpg/1920px-Praia_do_Rosa_%2815666905785%29.jpg', 'Otávio Nogueira from Fortaleza, BR', 'CC BY 2.0', 'https://commons.wikimedia.org/wiki/File:Praia_do_Rosa_(15666905785).jpg'),
  ('rancho-queimado', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Rancho_Queimado_%28Rio%29.jpg/1920px-Rancho_Queimado_%28Rio%29.jpg', 'AndreWormsbecker', 'CC BY-SA 4.0', 'https://commons.wikimedia.org/wiki/File:Rancho_Queimado_(Rio).jpg'),
  ('santo-amaro-da-imperatriz', 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Hotel_Caldas_da_Imperatriz%2C_Santo_Amaro_da_Imperatriz_%28municipality%29%2C_Santa_Catarina_State%2C_Brazil.JPG/1920px-Hotel_Caldas_da_Imperatriz%2C_Santo_Amaro_da_Imperatriz_%28municipality%29%2C_Santa_Catarina_State%2C_Brazil.JPG', 'Eugenio Hansen, OFS', 'CC BY-SA 3.0', 'https://commons.wikimedia.org/wiki/File:Hotel_Caldas_da_Imperatriz,_Santo_Amaro_da_Imperatriz_(municipality),_Santa_Catarina_State,_Brazil.JPG')
) as novo (slug, url, autor, licenca, origem)
where p.slug = novo.slug;
