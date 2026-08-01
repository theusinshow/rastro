/**
 * A OUTRA METADE DA PALETA.
 *
 * O MapLibre desenha em WebGL e não lê variável CSS. Estes hex espelham
 * `globals.css` à mão, e as duas metades precisam mudar na mesma passada —
 * mudar uma sem a outra faz interface e mapa divergirem, que foi exatamente o
 * que aconteceu no ADR 0009.
 *
 * As duas variantes moram no mesmo arquivo, e não em dois, justamente para que
 * acrescentar uma cor sem acrescentar a irmã seja um erro de tipo.
 *
 * Três princípios valem nas duas:
 *
 * 1. **A estrada é o conteúdo** — ela recebe o maior contraste do mapa.
 * 2. **O fundo cede o palco**, e cede o matiz junto.
 * 3. **Relevo importa** — as serras catarinenses precisam existir visualmente.
 *
 * O princípio 1 é o que INVERTE entre as duas: no escuro a rodovia é a via mais
 * clara; no claro, a mais escura. Contraste é distância do fundo, não claridade.
 */
export type MapTheme = 'escuro' | 'claro'

export interface MapPalette {
  background: string
  water: string
  waterOutline: string
  vegetation: string
  forest: string
  hillshadeExaggeration: number
  hillshadeShadow: string
  hillshadeHighlight: string
  hillshadeAccent: string
  /** Quatro níveis de via, do menor ao maior. */
  roadLocal: string
  roadCollector: string
  roadArterial: string
  roadHighway: string
  boundary: string
  labelSmall: string
  labelLarge: string
  labelHalo: string
  poiStroke: string
  poiText: string
  poiHalo: string
}

/** Pins — camadas data-driven (ADR 0005). Espelham `--color-visited`/`wanted`/`unvisited`. */
export interface PinPalette {
  visited: string
  wanted: string
  unvisited: string
  /** Miolo do pin não visitado: a cor da superfície de painel. O pin é oco. */
  hollow: string
  /** Anel do pin selecionado: a cor da tinta. */
  bone: string
}

/**
 * Traçado da viagem — a marca virando dado.
 *
 * Asfalto e, por cima, a faixa central tracejada **na cor do fundo do mapa**:
 * asfalto cortado, não uma linha por cima. Mesma geometria da perna do R e mesma
 * geometria da régua de "estimado".
 */
export interface TripTracePalette {
  asphalt: string
  centerLine: string
}

export interface ThemePalette {
  map: MapPalette
  pin: PinPalette
  trip: TripTracePalette
}

const ESCURO: ThemePalette = {
  map: {
    background: '#0d0d0c',
    water: '#101b2a',
    waterOutline: '#1a2c46',
    vegetation: '#141e11',
    forest: '#182414',
    hillshadeExaggeration: 0.38,
    hillshadeShadow: '#000000',
    hillshadeHighlight: '#3b3936',
    hillshadeAccent: '#141312',
    roadLocal: '#35332f',
    roadCollector: '#665e52',
    roadArterial: '#958b7d',
    roadHighway: '#c3baa8',
    boundary: '#2c2926',
    labelSmall: '#bcb2a4',
    labelLarge: '#dad2c5',
    labelHalo: '#0e0d0c',
    poiStroke: '#958b7d',
    poiText: '#958b7d',
    poiHalo: '#0d0d0c',
  },
  pin: {
    visited: '#93a86e',
    wanted: '#e5a338',
    unvisited: '#9b9082',
    hollow: '#191817',
    bone: '#ede6db',
  },
  trip: { asphalt: '#e5a338', centerLine: '#0e0d0c' },
}

/**
 * A régua, de dia.
 *
 * Os pins e o traçado vêm do handoff do design. A cartografia foi derivada aqui
 * porque o handoff entregou o mapa claro como filtro CSS sobre tiles do OSM — um
 * atalho de protótipo que ele mesmo manda descartar.
 *
 * A derivação segue os três princípios invertendo o que precisa inverter:
 *
 * - **A rodovia é a via mais ESCURA**, e a local a mais próxima do fundo. No
 *   escuro é o contrário. O que se preserva não é a claridade, é a distância do
 *   fundo — é ela que faz a estrada ser o conteúdo.
 * - **O relevo exagera menos** (0.28 contra 0.38): sombra sobre areia clara pesa
 *   mais que sombra sobre carvão, e no mesmo valor as serras viravam manchas.
 * - **O halo dos rótulos é claro**, e não escuro, pelo mesmo motivo de sempre:
 *   ele existe para separar a letra do que passa embaixo dela.
 */
const CLARO: ThemePalette = {
  map: {
    background: '#efe9de',
    water: '#bfd0de',
    waterOutline: '#93aabf',
    vegetation: '#d5dfc6',
    forest: '#c4d2b1',
    hillshadeExaggeration: 0.28,
    hillshadeShadow: '#6b5f4d',
    hillshadeHighlight: '#fffdf8',
    hillshadeAccent: '#cfc4b0',
    roadLocal: '#dcd4c6',
    roadCollector: '#b3a794',
    roadArterial: '#877860',
    roadHighway: '#57492f',
    boundary: '#d0c7b7',
    labelSmall: '#554d43',
    labelLarge: '#211d18',
    labelHalo: '#f4efe6',
    poiStroke: '#877860',
    poiText: '#554d43',
    poiHalo: '#efe9de',
  },
  pin: {
    visited: '#445d24',
    wanted: '#7d4a06',
    unvisited: '#635a4e',
    hollow: '#f4efe6',
    bone: '#211d18',
  },
  trip: { asphalt: '#c8821a', centerLine: '#f4efe6' },
}

const PALETTES: Record<MapTheme, ThemePalette> = {
  escuro: ESCURO,
  claro: CLARO,
}

export function paletteFor(theme: MapTheme): ThemePalette {
  return PALETTES[theme]
}
