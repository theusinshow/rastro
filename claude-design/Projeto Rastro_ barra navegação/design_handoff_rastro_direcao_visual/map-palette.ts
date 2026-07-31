/**
 * A OUTRA METADE DA PALETA.
 *
 * O MapLibre desenha em WebGL e não lê variável CSS. Estes hex espelham
 * tokens.css à mão. Mudar um lado sem o outro faz interface e mapa divergirem
 * — foi exatamente o que aconteceu no ADR 0009.
 *
 * Três princípios permanecem: estrada é o conteúdo, fundo cede o palco,
 * relevo importa.
 *
 * Destino: src/lib/map/style.ts  e  src/lib/map/layers.ts
 */

export const MAP = {
  background: '#0d0d0c',

  water:        '#101b2a',
  waterOutline: '#1a2c46',

  vegetation:   '#141e11',   // opacidade 0.75
  forest:       '#182414',   // opacidade 0.60

  hillshadeShadow:    '#000000',
  hillshadeHighlight: '#3b3936',
  hillshadeAccent:    '#141312',

  // 4 níveis de via, do menor ao maior. A rodovia é a mais clara: é o conteúdo.
  roadLocal:     '#35332f',
  roadCollector: '#665e52',
  roadArterial:  '#958b7d',
  roadHighway:   '#c3baa8',

  labelSmall: '#bcb2a4',
  labelLarge: '#dad2c5',
  labelHalo:  '#0e0d0c',

  poiStroke: '#958b7d',
  poiText:   '#958b7d',
  poiHalo:   '#0d0d0c'
} as const;

/** Pins — camadas data-driven (ADR 0005). Espelham --color-visited/wanted/unvisited. */
export const PIN = {
  VISITED:   '#93a86e',
  WANTED:    '#e5a338',
  UNVISITED: '#9b9082',
  HOLLOW:    '#191817',  // miolo do pin não visitado — igual a --color-base
  BONE:      '#ede6db'   // anel do pin selecionado
} as const;

/**
 * Traçado da viagem — a marca virando dado.
 * Duas camadas empilhadas: asfalto âmbar, e por cima a faixa central tracejada
 * na cor do FUNDO (asfalto cortado, não linha por cima). Mesma geometria da
 * perna do R e mesma geometria da régua de "estimado". É o único lugar do
 * produto onde a identidade vira informação literal.
 */
export const TRIP_TRACE = {
  asphalt:    { color: '#e5a338', width: 7, cap: 'round' as const, join: 'round' as const },
  centerLine: { color: '#0e0d0c', width: 2, dasharray: [4.5, 5.5], cap: 'butt' as const }
};

/**
 * Câmera: NUNCA passar { essential: true } em flyTo/easeTo.
 * É o que permite ao MapLibre honrar prefers-reduced-motion sozinho
 * (camada "delegado" da política de movimento).
 */
