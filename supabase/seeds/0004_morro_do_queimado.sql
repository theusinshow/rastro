-- Catálogo curado — terceira leva. Um lugar.
--
-- O QUE ESTÁ VERIFICADO E O QUE NÃO ESTÁ, na mesma disciplina do
-- `0003_lugares_de_santa_catarina.sql`:
--
-- * **A coordenada está verificada, e não veio do geocodificador do produto.**
--   Perguntar "Morro do Queimado, Santo Amaro da Imperatriz" ao MapTiler devolve
--   o BAIRRO Morro Queimado, em -27.7145 / -48.7654. Aceitar esse ponto poria o
--   pino no sopé: o modelo de elevação dá **200 m** ali, contra **606 m** no
--   ponto abaixo. O bairro é onde as pessoas moram; o mirante é para onde se
--   sobe, e são coisas diferentes separadas por 1,4 km.
--
--   O ponto usado aqui é o nó `natural=peak` do OpenStreetMap, que traz o mesmo
--   CEP 88140-000 do endereço informado, e coincide em 17 m com o nó
--   `tourism=attraction` "Topo do Morro Queimado". Duas entradas independentes
--   apontando para o mesmo cume.
--
-- * **A altitude NÃO entra, e é de propósito.** Três fontes discordam: a
--   etiqueta `ele` do OSM diz 580 m, o modelo do Open-Meteo diz 606 m, e o
--   Visite Floripa diz 694 m. O produto calcula elevação a partir da coordenada
--   e mostra com régua — escrever um desses números na descrição seria afirmar
--   como fato o que três fontes não confirmam entre si.
--
-- * **A descrição NÃO está verificada por quem esteve lá.** É texto nosso, e
--   descreve o que o lugar é. Que se sobe por estrada de chão é a natureza do
--   acesso, e as fontes concordam; **a condição dessa estrada não está aqui e
--   não deve entrar** — ela muda com a chuva, e o catálogo não promete isso.
--
-- O QUE NÃO COUBE. O fato que mais importa numa moto — que o trecho final é
-- chão solto e enche de sulco depois de chuva — não tem onde morar no catálogo:
-- `access_surface` vive em `place_user_states` (migration 0007), porque é
-- leitura de quem foi, não fato compartilhável. Quem subir marca no seu próprio
-- estado do lugar.
--
-- O NOME. O OSM registra "Morro Queimado"; o Visite Floripa e o TripAdvisor
-- usam "Morro do Queimado". Fica a segunda forma, que é a corrente e a que foi
-- pedida.
--
-- `created_by = null` marca o lugar como do catálogo, não de um usuário: é o
-- que a interface lê para decidir que ele não pode ser editado nem apagado.
--
-- Idempotente: `on conflict (slug) do nothing`. Rodar de novo não duplica.
-- A CAPA, e as duas ressalvas que vêm com ela.
--
-- As três colunas de crédito ficam nulas, o que a migration 0009 define como
-- "não há crédito a exibir" — o caso de foto própria. **Isto vale enquanto a
-- foto for do dono do catálogo.** O endereço abaixo está em
-- `lh3.googleusercontent.com/gps-cs-s/…`, que é onde o Google guarda foto
-- CONTRIBUÍDA a uma ficha do Maps; se a foto for de terceiro, nulo aqui deixa
-- de ser verdade e o crédito passa a ser obrigação, como é para toda foto do
-- Commons neste catálogo.
--
-- E o endereço é do CDN do Google, não nosso: ele não promete permanência, e o
-- dia em que rodar a capa some para todo mundo. O lugar estável é o bucket
-- `fotos` do próprio projeto, que já existe.
insert into public.places
  (slug, name, description, latitude, longitude, municipality,
   state_code, category, tags, cover_image_url, source, created_by, is_public)
values
  ('morro-do-queimado', 'Morro do Queimado',
   'Rampa de parapente e mirante sobre a Grande Florianópolis, no alto do Parque Estadual da Serra do Tabuleiro, alcançado por estrada de chão.',
   -27.7176, -48.7799, 'Santo Amaro da Imperatriz', 'SC', 'mirante',
   array['parapente','vista','serra do tabuleiro'],
   'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkaJDqWk7hiXXLplL5NDWYa6sKEuPUR0zv6eG22u5mUGzqMxOqxjGBhuuEzXvvQ-3w4DpU82BXizYfamaeAcV_m7NQaGe1N7c6hDtRm9joY4Q0CX9awK6mBsyYVdZY4Y9QZlQWc2w=s680-w680-h510-rw',
   'imported', null, true)
on conflict (slug) do nothing;
