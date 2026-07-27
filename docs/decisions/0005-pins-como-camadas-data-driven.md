# 0005 — Pins como camadas data-driven

## Contexto

O brief original listava cinco estados de pin — não visitado, quero conhecer,
visitado, favorito, com fotos — como se fossem categorias mutuamente
exclusivas, do tipo que se resolve com uma cor por estado. Mas um lugar real
pode estar em várias dessas categorias ao mesmo tempo: a Serra do Rio do Rastro
é visitada, é favorita e tem fotos, tudo simultaneamente. Uma cor única por pin
não tem como representar essa combinação sem inventar uma cor nova para cada
composição possível — o que não escala e não é legível.

Havia também uma segunda decisão em aberto: desenhar os pins como marcadores
HTML posicionados sobre o mapa (a abordagem do `react-map-gl` e de a maioria
dos exemplos de mapa na web) ou como camadas nativas do MapLibre, desenhadas em
WebGL a partir de uma fonte GeoJSON.

## Decisão

Três canais visuais independentes, cada um lido separadamente:

| Canal | Camada | Codifica |
|---|---|---|
| Cor do miolo e do contorno | `places-core` | Status de visita |
| Anel externo | `places-favorite-ring` | Favorito |
| Ponto satélite | `places-photo-dot` | Possui fotos |

Cada canal é uma camada `circle` própria, filtrada e coloreada por expressões
`match`/`filter` que leem propriedades da feature GeoJSON. Nenhum HTML: os pins
são desenhados inteiramente pelo MapLibre sobre a mesma fonte `places`.

## Motivos

- **Combinações ficam representáveis.** Visitado, favorito e com fotos deixam
  de competir por uma única cor e passam a ser três bits independentes,
  compostos livremente sobre o mesmo ponto.
- **Desempenho.** O desenho acontece em WebGL, na mesma passada de renderização
  do resto do mapa. Milhares de pontos custam o mesmo que uma dezena — não há
  nó de DOM por pin, não há re-render do React por movimento de câmera.
- **Leitura cartográfica.** O resultado se parece com uma carta, não com uma
  interface colada sobre uma imagem de mapa. É consistente com o restante do
  estilo autoral descrito em `docs/MAP-STRATEGY.md`.

## Ajuste em relação ao brief original

O anel de favorito usa **osso** (`#e8edea`), não âmbar. Âmbar já codifica
"quero conhecer" no miolo: um anel âmbar em volta de um miolo âmbar seria
ilegível (a mesma cor duas vezes, sem contraste), e um anel âmbar em volta de
um miolo verde (visitado) sugeriria falsamente uma mistura de status que não
existe — favorito não é um status de visita. Osso lê como destaque neutro e não
colide com nenhum dos três estados de visita.

## Custo aceito

As cores das camadas de pin (`VISITED`, `WANTED`, `UNVISITED`, `HOLLOW`,
`BONE`) ficam duplicadas entre os tokens CSS de `src/app/globals.css` e as
constantes de `src/lib/map/layers.ts`, porque o MapLibre desenha em WebGL e não
tem acesso a variáveis CSS — uma expressão de camada precisa do valor literal
em tempo de construção do estilo. A duplicação está marcada com um comentário
no código, no ponto onde as constantes são declaradas, para que alterar um
token do design system lembre de propagar a mudança para o mapa.
