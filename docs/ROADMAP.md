# Roteiro do Rastro

Sem prazos. Três blocos de intenção — o que vem a seguir, o que vem depois
disso, e o que é possível mas ainda incerto — mais um bloco do que é
deliberadamente fora de escopo. A ordem dentro de cada bloco não é prioridade
fixa.

Volte sempre ao princípio do produto (`CLAUDE.md`) em caso de dúvida: o
Google Maps responde "como chego lá?"; o Rastro responde "para onde eu vou?",
"onde eu já estive?", "o que ainda quero conhecer?" e "quais histórias
ficaram dessas viagens?".

---

## Concluído — fase de persistência e identidade

- Migration `0001` aplicada contra um Postgres real. As oito tabelas existem.
- Supabase conectado, com o catálogo vindo do banco.
- Autenticação pelo Google; `DEV_USER_ID` não existe mais.
- Origem por usuário, escolhida clicando no mapa (`profiles.home_*`).
- Ações de escrita do painel: favorito, quero conhecer e histórico de visitas.
- Criar, editar e apagar lugares próprios.

## Próximo

- **Registro de viagens com paradas** — criar `trips` e `trip_stops` a partir
  de uma viagem real, incluindo múltiplas paradas ordenadas
  (`trip_stops.order_index`). É a quarta pergunta do produto — "quais histórias
  ficaram dessas viagens?" — e a única das quatro que ainda não tem resposta.
  `PlaceActions` mantém "Criar viagem" visível sob "Em breve" à espera disto.
- **Upload de fotos no Supabase Storage**, associadas a `trip_photos`, com o
  caminho gravado em `storage_path`.

## Depois

- **Tela de Memórias com timeline por ano e mês** — a rota `/memorias`
  existe hoje como stub explicativo (`src/app/(app)/memorias/page.tsx`);
  vira uma timeline real de `trips` com `status = 'completed'`.
- **Página de viagem concluída no formato de diário**, com mapa da rota
  (`trips.route_geojson`) e galeria de `trip_photos`.
- **Estatísticas** — quilometragem total, municípios visitados, maior
  viagem, quilometragem por moto, regiões exploradas. `docs/DATA-MODEL.md`
  já documenta, em "Perguntas que o schema já responde", a consulta em
  linguagem natural para cada uma.
- ~~**Navegação mobile própria.**~~ Feito. Os quatro destinos moram numa barra
  inferior abaixo de 768px, ao alcance do polegar, e a barra do topo voltou a
  uma linha só. O sintoma registrado aqui — "a barra rola na horizontal" — já
  tinha sido resolvido pelo empilhamento glifo/rótulo; o problema real era
  alcance, e alcance não se resolve rolando.
- **Leitura de EXIF** para posicionar fotos no mapa automaticamente —
  `trip_photos.latitude`/`longitude`/`taken_at`/`exif` já existem no schema,
  preparadas e não populadas ainda (ver `docs/DATA-MODEL.md`).

## Talvez

- **Glyphs próprios para os labels do mapa** — hoje impossível com os glyphs
  que o MapTiler hospeda (Noto Sans e afins); exigiria gerar e servir um
  conjunto `.pbf` próprio, custo de infraestrutura hoje desproporcional ao
  ganho (ver `docs/MAP-STRATEGY.md` e `docs/DESIGN-SYSTEM.md`).
- **Migração para PostGIS**, conforme o gatilho registrado em
  [ADR 0004](./decisions/0004-sem-postgis-nesta-fase.md): o catálogo passar
  de alguns milhares de lugares, ou surgir necessidade de consulta por
  polígono que haversine não resolve.
- **Importação de lugares de fontes externas**, para além dos 14 do catálogo
  curado — que continuam marcados `source = 'mock'` no banco, porque continuam
  não verificados. Menos urgente desde que criar lugar próprio existe.
- **Notas pessoais e avaliação por lugar** — `place_user_states.personal_notes`
  e `rating` existem no schema e não são escritos por nenhuma tela.
- **Múltiplas motos com estatísticas comparadas** — o schema já suporta
  várias `motorcycles` por usuário; falta a leitura comparativa (km por
  moto).

## Fora de escopo declarado

Rede social, feed público, scraping, integração com Instagram, recomendação
por IA, tracking GPS em tempo real, app nativo, gamificação. Se uma proposta
recair em uma dessas categorias, ela provavelmente serve melhor ao Google
Maps — ou a outro produto — do que ao Rastro.
