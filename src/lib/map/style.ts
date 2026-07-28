import type { StyleSpecification } from 'maplibre-gl'

/**
 * Estilo autoral do Rastro sobre os vector tiles do MapTiler (schema
 * OpenMapTiles).
 *
 * Três princípios:
 *
 * 1. A estrada é o conteúdo. Num app de moto a malha viária recebe o maior
 *    contraste do mapa, acima de qualquer outro elemento de base.
 * 2. O fundo cede o palco. Água quase preta, vegetação apenas insinuada — o que
 *    precisa ser lido são os pins e as estradas.
 * 3. Relevo importa. O hillshade a partir do terrain-RGB é o que faz as serras
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
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#14100c' },
      },
      {
        id: 'landcover-wood',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'landcover',
        filter: ['==', ['get', 'class'], 'wood'],
        paint: { 'fill-color': '#191309', 'fill-opacity': 0.75 },
      },
      {
        id: 'park',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'park',
        paint: { 'fill-color': '#1c1610', 'fill-opacity': 0.6 },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'water',
        // Única cor que continua fria numa base quente, e de propósito: água
        // marrom lê como terra. O frio aqui é o que a separa do continente.
        paint: { 'fill-color': '#080a0f' },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'basemap',
        'source-layer': 'waterway',
        paint: {
          'line-color': '#0e1420',
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
          'hillshade-highlight-color': '#4a3d2c',
          'hillshade-accent-color': '#1b140c',
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
          'line-color': '#3a3229',
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
          'line-color': '#6b5e4b',
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
          'line-color': '#9c8c74',
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
          'line-color': '#cbbb9e',
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 16, 9],
        },
      },
      {
        id: 'boundary-admin',
        type: 'line',
        source: 'basemap',
        'source-layer': 'boundary',
        filter: ['<=', ['get', 'admin_level'], 4],
        paint: {
          'line-color': '#332a1f',
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
          'text-color': '#bfae97',
          'text-halo-color': '#14100c',
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
          'text-color': '#e0d3bd',
          'text-halo-color': '#14100c',
          'text-halo-width': 1.4,
        },
      },
    ],
  }
}
