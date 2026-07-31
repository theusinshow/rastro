import type { StyleSpecification } from 'maplibre-gl'

/**
 * Estilo autoral do Rastro sobre os vector tiles do MapTiler (schema
 * OpenMapTiles).
 *
 * Três princípios:
 *
 * 1. A estrada é o conteúdo. Num app de moto a malha viária recebe o maior
 *    contraste do mapa, acima de qualquer outro elemento de base — e é o único
 *    lugar do mapa que continua quente, porque é o que se lê.
 * 2. O fundo cede o palco, e cede o MATIZ junto. Terreno quase neutro: ele
 *    cobre a tela inteira, e saturação repetida por essa área vira banho de cor
 *    em vez de tom. Ver ADR 0012.
 * 3. Água é água. Ela ocupa um quarto de qualquer vista do litoral catarinense;
 *    escura demais, vira buraco preto e desperdiça o único frio do mapa.
 * 4. Relevo importa. O hillshade a partir do terrain-RGB é o que faz as serras
 *    catarinenses existirem visualmente em vez de virarem mancha plana.
 *
 * Nenhuma cor aqui usa o âmbar do produto: o âmbar é reservado aos pins e à
 * interface, para que sempre se destaque contra a base.
 *
 * As cores são hex literal, e não tokens: o MapLibre desenha em WebGL e não lê
 * variável CSS. Elas espelham à mão a paleta de `globals.css` — mudar uma sem a
 * outra faz a interface e o mapa divergirem, que foi exatamente o risco levantado
 * ao adotar o ADR 0009.
 */
export function buildRastroStyle(key: string): StyleSpecification {
  const tiles = `https://api.maptiler.com/tiles/v3/tiles.json?key=${key}`
  const terrain = `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`

  return {
    version: 8,
    glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${key}`,
    sources: {
      basemap: { type: 'vector', url: tiles },
      terrain: { type: 'raster-dem', url: terrain, tileSize: 256 },
    },
    layers: [
      {
        // Um degrau abaixo do `void` da interface: abaixo dele o chão lê como
        // chão e as estradas saltam.
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#0d0d0c' },
      },
      {
        // Vegetação é um dos dois lugares do mapa onde o MATIZ carrega
        // significado: floresta marrom não lê como floresta. Com o terreno
        // neutro em volta, o verde finalmente tem contra o que aparecer — e SC
        // é floresta, então isso é massa de cor de verdade, não um detalhe.
        id: 'landcover-wood',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'landcover',
        filter: ['==', ['get', 'class'], 'wood'],
        paint: { 'fill-color': '#131d10', 'fill-opacity': 0.75 },
      },
      {
        id: 'park',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'park',
        paint: { 'fill-color': '#172313', 'fill-opacity': 0.6 },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'water',
        // O outro lugar onde o matiz significa. Estava em `#080a0f` — 4,5% de
        // luminosidade, frio no papel e buraco preto na tela. O Atlântico ocupa
        // um quarto de qualquer vista do litoral: escondê-lo era jogar fora a
        // maior massa fria disponível, e era metade do motivo de o mapa inteiro
        // ler como marrom.
        paint: { 'fill-color': '#0e1a29' },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'basemap',
        'source-layer': 'waterway',
        paint: {
          'line-color': '#182b45',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.4, 14, 1.6],
        },
      },
      {
        // Relevo. Fica acima da base e abaixo das estradas, de modo que a
        // sombra dê volume ao terreno sem sujar a malha viária.
        id: 'hillshade',
        type: 'hillshade',
        source: 'terrain',
        paint: {
          'hillshade-exaggeration': 0.38,
          'hillshade-shadow-color': '#000000',
          // Cinza praticamente neutro. O hillshade cobre a tela INTEIRA — é a
          // camada onde saturação custa mais caro, porque ela multiplica por
          // toda a área visível. O que sobrou de quente aqui é lembrança, não
          // cor.
          'hillshade-highlight-color': '#3a3835',
          'hillshade-accent-color': '#131311',
        },
      },
      {
        id: 'road-minor',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        minzoom: 10,
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#34322f',
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.4, 16, 3],
        },
      },
      {
        id: 'road-tertiary',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['tertiary', 'secondary']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#655d51',
          'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.5, 16, 5],
        },
      },
      {
        id: 'road-primary',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['primary', 'trunk']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#948a7c',
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 16, 7],
        },
      },
      {
        id: 'road-motorway',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        filter: ['==', ['get', 'class'], 'motorway'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#c2b9a7',
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 16, 9],
        },
      },
      {
        /*
         * Postos de combustível.
         *
         * Vêm dos tiles que já baixamos — a camada `poi` do OpenMapTiles traz
         * `class: 'fuel'`. Nenhuma requisição a mais, nenhum serviço novo.
         *
         * `minzoom: 14` é MEDIDO, não escolhido. A camada `poi` é anunciada a
         * partir do zoom 11, mas o OpenMapTiles inclui POI progressivamente por
         * `rank`, e posto não entra no tile antes do 14: em Palhoça, z13 devolve
         * zero e z14 devolve 23, com nome. Declarar 11 faria o MapLibre consultar
         * três níveis de zoom que nunca têm nada.
         *
         * Desenhados como anel vazado e discreto, e não como símbolo cheio: num
         * app de moto o posto é INFRAESTRUTURA, não destino. Ele precisa estar
         * ali quando se procura e sumir do caminho quando não se procura — os
         * pins de lugar é que são o conteúdo.
         *
         * Osso, e nunca âmbar: o âmbar é do produto, reservado aos pins e à
         * interface. Ver o cabeçalho deste arquivo.
         */
        id: 'poi-fuel',
        type: 'circle',
        source: 'basemap',
        'source-layer': 'poi',
        minzoom: 14,
        filter: ['==', ['get', 'class'], 'fuel'],
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 14, 3, 16, 5.5],
          'circle-color': 'rgba(0,0,0,0)',
          'circle-stroke-color': '#948a7c',
          'circle-stroke-width': 1.5,
          'circle-opacity': 1,
        },
      },
      {
        id: 'poi-fuel-label',
        type: 'symbol',
        source: 'basemap',
        'source-layer': 'poi',
        // Um degrau acima do anel: em z14 há 23 postos numa tela de Palhoça, e
        // 23 nomes ao mesmo tempo viram ruído. O anel já responde "tem posto
        // aqui"; o nome só importa quando se está escolhendo qual.
        minzoom: 15,
        filter: ['==', ['get', 'class'], 'fuel'],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 9,
          'text-offset': [0, 1.1],
          'text-anchor': 'top',
          'text-max-width': 8,
          // O nome cede à colisão: um posto sem nome legível continua sendo um
          // posto visível, e o anel já diz o que importa.
          'text-optional': true,
        },
        paint: {
          'text-color': '#948a7c',
          'text-halo-color': '#0d0d0c',
          'text-halo-width': 1.2,
        },
      },
      {
        id: 'boundary-admin',
        type: 'line',
        source: 'basemap',
        'source-layer': 'boundary',
        filter: ['<=', ['get', 'admin_level'], 4],
        paint: {
          'line-color': '#2c2926',
          'line-width': 0.7,
          'line-dasharray': [3, 2],
        },
      },
      {
        id: 'road-label',
        type: 'symbol',
        source: 'basemap',
        'source-layer': 'transportation_name',
        minzoom: 11,
        layout: {
          'symbol-placement': 'line',
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 10,
          'text-letter-spacing': 0.08,
        },
        paint: {
          'text-color': '#b7ad9f',
          'text-halo-color': '#11100f',
          'text-halo-width': 1.2,
        },
      },
      {
        // Caixa alta e tracking largo: é daqui que vem a leitura cartográfica,
        // já que a família não pode ser a mono do produto — o MapTiler só serve
        // glyphs de famílias que ele hospeda.
        id: 'place-label',
        type: 'symbol',
        source: 'basemap',
        'source-layer': 'place',
        filter: [
          'in',
          ['get', 'class'],
          ['literal', ['city', 'town', 'village']],
        ],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.16,
          'text-size': ['interpolate', ['linear'], ['zoom'], 6, 9, 12, 12],
          'text-max-width': 8,
        },
        paint: {
          'text-color': '#d9d1c4',
          'text-halo-color': '#11100f',
          'text-halo-width': 1.4,
        },
      },
    ],
  }
}
