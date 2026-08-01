/**
 * O losango do posto de combustível, desenhado em pixels.
 *
 * **Por que uma forma nova, e não mais uma cor.** Os pins do catálogo são
 * discos (ADR 0005), e o ADR 0019 registrou o preço de separar dois significados
 * só por matiz: visitado e quero-conhecer chegaram a 1.19:1 um do outro, e
 * ninguém pegou isso olhando. Posto não é destino — é serviço — e a distinção
 * precisa sobreviver a 12px, a sol na tela e a daltonismo. Silhueta sobrevive;
 * cor sozinha, não.
 *
 * **Por que rasterizado à mão, e não um `<canvas>`.** O MapLibre aceita
 * `addImage` com RGBA cru, e uma função pura de aritmética é testável no mesmo
 * ambiente `node` do resto do domínio — um canvas exigiria jsdom só para provar
 * que um losango é um losango. Também não entra dependência nenhuma: são
 * cinquenta linhas contra um pacote de ícones.
 */

/** Imagem RGBA no formato que `map.addImage` aceita direto. */
export interface RasterIcon {
  width: number
  height: number
  data: Uint8Array
}

interface Rgb {
  r: number
  g: number
  b: number
}

/**
 * `#8fa9c2` → `{ r: 143, g: 169, b: 194 }`.
 *
 * Só hex de seis dígitos: é o formato em que a paleta do mapa vive
 * (`palette.ts`), e aceitar outros formatos abriria caminho para uma cor entrar
 * aqui sem passar pelo teste de contraste.
 */
export function hexToRgb(hex: string): Rgb {
  const pairs = hex.replace('#', '').match(/../g)
  if (!pairs || pairs.length !== 3) {
    throw new Error(`hex inválido: ${hex}`)
  }
  const [r, g, b] = pairs.map((pair) => parseInt(pair, 16)) as [
    number,
    number,
    number,
  ]
  return { r, g, b }
}

interface DiamondOptions {
  /** Lado da imagem em pixels de dispositivo. Ímpar centraliza melhor. */
  size: number
  /** Miolo. */
  fill: string
  /** Contorno — no uso real, a cor do fundo do mapa, para descolar do terreno. */
  stroke: string
  /** Espessura do contorno, em pixels. */
  strokeWidth: number
}

/** Recorta em [0, 1]. */
function clamp01(value: number): number {
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/**
 * Um losango preenchido com contorno.
 *
 * A geometria é a distância de Manhattan ao centro (`|dx| + |dy|`), cujo
 * conjunto de nível é exatamente um quadrado girado 45°. A borda ganha
 * suavização de um pixel pela cobertura parcial — sem ela, o losango fica
 * serrilhado e lê como falha de renderização em vez de marcador.
 */
export function buildDiamondIcon({
  size,
  fill,
  stroke,
  strokeWidth,
}: DiamondOptions): RasterIcon {
  const fillRgb = hexToRgb(fill)
  const strokeRgb = hexToRgb(stroke)

  const data = new Uint8Array(size * size * 4)
  const center = (size - 1) / 2
  // Um pixel de folga na borda: sem ela a suavização é cortada pela moldura da
  // imagem e as quatro pontas do losango saem chanfradas.
  const outer = center - 1
  const inner = outer - strokeWidth

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const distance = Math.abs(x - center) + Math.abs(y - center)

      const alpha = clamp01(outer + 0.5 - distance)
      if (alpha <= 0) continue

      const isFill = clamp01(inner + 0.5 - distance)
      const offset = (y * size + x) * 4

      data[offset] = Math.round(fillRgb.r * isFill + strokeRgb.r * (1 - isFill))
      data[offset + 1] = Math.round(
        fillRgb.g * isFill + strokeRgb.g * (1 - isFill),
      )
      data[offset + 2] = Math.round(
        fillRgb.b * isFill + strokeRgb.b * (1 - isFill),
      )
      data[offset + 3] = Math.round(alpha * 255)
    }
  }

  return { width: size, height: size, data }
}
