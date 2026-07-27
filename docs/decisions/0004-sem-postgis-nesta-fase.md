# 0004 — Sem PostGIS nesta fase

## Contexto

Consultas por raio — "lugares até 150 km de Palhoça", o filtro central do
Explore — são um caminho quente do produto. O Postgres, via extensão PostGIS,
oferece um tipo `geography(Point)`, a função `ST_DWithin` para busca por raio, e
índices GiST otimizados para essas consultas. Seria a escolha natural para
qualquer aplicação de mapa que planeje escalar para consultas geoespaciais
sofisticadas.

## Decisão

Manter `latitude` e `longitude` como colunas simples `double precision` em
`places` (e nas demais tabelas que guardam coordenadas), e calcular distância
por haversine em código puro, em `src/domain/geo.ts` (`haversineKm`), consumida
por `src/domain/filters.ts` e `src/domain/discovery.ts`. Nenhuma extensão
PostGIS é habilitada nesta fase.

## Motivos

- **A escala atual não justifica o ganho.** Com um catálogo de centenas de
  lugares, uma varredura completa com haversine em memória — ou mesmo com o
  índice de apoio `places_lat_lng_idx` para recorte por caixa envolvente antes
  do cálculo — é irrelevante em termos de desempenho. O ganho de PostGIS só
  aparece em escalas que o produto não tem hoje nem projeta ter em breve.
- **PostGIS quebraria a paridade entre o repositório mock e o futuro adapter
  Supabase.** O projeto expõe a interface `PlaceRepository`
  (`src/lib/data/place-repository.ts`), hoje com um único adapter: o de memória
  (`src/lib/data/mock/mock-place-repository.ts`). O adapter sobre Supabase está
  previsto e ainda não existe — conectá-lo é item pendente em `ROADMAP.md`. É
  justamente por isso que a decisão importa agora: se a filtragem por raio
  passasse a viver em `ST_DWithin` no banco, o adapter em memória teria de
  replicar a semântica exata de um tipo geométrico geodésico só para os dois
  concordarem quando o segundo chegar. Manter o cálculo em `double precision` +
  haversine no domínio evita essa duplicação de semântica antes que ela exista.
- **Testabilidade sem banco.** Com o cálculo de distância vivendo no domínio
  como função pura, ele é testado em `src/domain/geo.test.ts` sem precisar de
  Postgres, PostGIS ou qualquer conexão de rede.

## Gatilho de revisão

Reavaliar esta decisão quando:

- O catálogo de lugares passar de alguns milhares de linhas, ponto em que uma
  varredura em memória deixa de ser desprezível; ou
- Surgir necessidade de consulta por polígono — por exemplo, "regiões de Santa
  Catarina já exploradas" — que haversine simplesmente não resolve.

Quando esse gatilho disparar, a migração para PostGIS pode ser feita sem perda
de dados: adiciona-se uma coluna `geography(Point)` gerada a partir das
colunas `latitude`/`longitude` já existentes, em vez de substituí-las.

## Nota

`trips.route_geojson jsonb` segue a mesma lógica de fundo: o traçado da viagem
é guardado como GeoJSON, não como um tipo geométrico dedicado do Postgres. A
consistência de decisão importa mais do que forçar geometria nativa onde o
produto ainda não tem uma consulta que a exija.
