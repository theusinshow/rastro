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

/**
 * O escuro, refeito pelo ADR 0019.
 *
 * O que mudou, e por quê — os números estão travados em `palette.test.ts`:
 *
 * **1. `visited` desceu de `#93a86e` para `#4d6c2b`.** Era o defeito grave:
 * visitado e quero-conhecer ficavam a **1.19:1** um do outro. Ambos cheios,
 * separados só por matiz e praticamente na mesma luminância — para quem tem
 * daltonismo vermelho-verde, o mesmo pin; num raio de 7px sob sol, também.
 * Agora são 3.22:1, e a diferença é de LUZ, que sobrevive às duas coisas.
 *
 * O âmbar não podia descer no lugar dele: é o acento de instrumento do ADR 0016.
 * Quem recua é o visitado — e isso também acerta a semântica, porque o que você
 * ainda quer conhecer deve chamar mais que o que você já fez.
 *
 * **2. A sombra do relevo deixou de ser PRETO PURO.** `#000000` sobre um fundo
 * quase preto dava 1.82:1 de faixa de modelagem: as serras não existiam. Agora
 * 3.10:1. É a mudança mais visível de todas — é ela que faz serra parecer serra.
 *
 * **3. A água subiu por MATIZ, não por luz.** `#22384f` dá 1.55:1 contra o
 * fundo, que a norma de contraste chama de nada — mas razão de contraste só mede
 * luminância, e não enxerga matiz. Um azul saturado contra marrom-carvão é
 * obviamente outra coisa. Vale para fundo cartográfico; não valeria para texto.
 *
 * **4. A via local saiu de 1.54:1.** A escada das quatro vias agora sobe de
 * verdade: 1.8 → 3.7 → 7.1 → 13.2.
 *
 * **O fundo ESCURECEU um passo**, e é contraintuitivo: o pedido era "menos
 * escuro". Mas o orçamento de luz é de soma zero — todo passo que o terreno
 * clareia rouba contraste dos pins, e não existe paleta escura em que a
 * vegetação suba a 1.5:1 e os pins fiquem a 3:1 entre si. A vida vem do relevo e
 * da matiz, não da claridade. Quem quiser um mapa de fato claro tem o tema
 * `claro`, que é onde há espaço de luminância sobrando.
 */
const ESCURO: ThemePalette = {
  map: {
    background: '#16120f',
    water: '#22384f',
    waterOutline: '#31506e',
    vegetation: '#1d2617',
    forest: '#243019',
    hillshadeExaggeration: 0.42,
    hillshadeShadow: '#0a0704',
    hillshadeHighlight: '#665d4e',
    hillshadeAccent: '#1d1913',
    roadLocal: '#443e36',
    roadCollector: '#786d5e',
    roadArterial: '#aa9e8c',
    roadHighway: '#e2d8c4',
    boundary: '#37312a',
    labelSmall: '#c8bdab',
    labelLarge: '#efe7d9',
    labelHalo: '#16120f',
    poiStroke: '#aa9e8c',
    poiText: '#c8bdab',
    poiHalo: '#16120f',
  },
  pin: {
    /*
     * NÃO é `--color-visited` do `globals.css`, e a divergência é deliberada.
     *
     * Lá a cor é TEXTO ("visitado" na lista, no roteiro), e texto tem piso de
     * 4.5:1 — este oliva dá 2.96:1 sobre a superfície de painel e reprovaria.
     * Aqui a cor é um disco sobre o mapa, cujo trabalho é ser distinguível do
     * âmbar. Requisitos opostos, e um token só não atende os dois.
     *
     * É exatamente a razão pela qual `--color-accent` e `--color-accent-fill` já
     * são separados no `globals.css` — mesmo problema, mesma solução. Mesma
     * matiz nos dois lugares; o que muda é o tom que cada superfície comporta.
     */
    visited: '#4d6c2b',
    wanted: '#f0b34a',
    unvisited: '#a4988a',
    hollow: '#1f1a16',
    bone: '#efe7d9',
  },
  trip: { asphalt: '#f0b34a', centerLine: '#16120f' },
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
    // Era `#dcd4c6`, a 1.22:1 do fundo — invisível, como a local do escuro
    // estava. Ver ADR 0019.
    roadLocal: '#bfb299',
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
    /*
     * O claro tinha o MESMO defeito do escuro, e pior: `#445d24` contra
     * `#7d4a06` dava **1.006:1** — luminância idêntica, dois pins que só um
     * olho com visão de cor perfeita separava, e mesmo esse com esforço.
     * Descoberto pelo teste de contraste, não pela revisão. Ver ADR 0019.
     *
     * Aqui quem recua também é o visitado, mas na direção oposta à do escuro:
     * sobre areia, recuar é ESCURECER até virar quase tinta, enquanto o âmbar
     * fica no meio do caminho, onde chama. O princípio é o mesmo — contraste é
     * distância do fundo, não claridade — e ele continua invertendo entre os
     * dois temas, como já invertia para as vias.
     */
    visited: '#2a3b12',
    wanted: '#b87615',
    unvisited: '#635a4e',
    hollow: '#f4efe6',
    bone: '#211d18',
  },
  trip: { asphalt: '#b87615', centerLine: '#f4efe6' },
}

const PALETTES: Record<MapTheme, ThemePalette> = {
  escuro: ESCURO,
  claro: CLARO,
}

export function paletteFor(theme: MapTheme): ThemePalette {
  return PALETTES[theme]
}
