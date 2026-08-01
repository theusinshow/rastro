import { describe, expect, it } from 'vitest'
import { paletteFor, type ThemePalette } from './palette'

/**
 * Contraste medido, e não julgado no olho.
 *
 * Este arquivo existe porque o defeito que motivou o ADR 0019 era **invisível na
 * revisão**: visitado e quero-conhecer pareciam duas cores diferentes para quem
 * olhava, e estavam a 1.19:1 um do outro. Ninguém pega isso lendo hex.
 *
 * A relação é de soma zero — clarear o terreno rouba contraste dos pins — então
 * qualquer mexida futura na paleta vai empurrar algum destes números para baixo.
 * O teste é o que transforma isso em falha de CI em vez de regressão silenciosa.
 */
function relativeLuminance(hex: string): number {
  const channels = hex.replace('#', '').match(/../g)
  if (!channels || channels.length !== 3) {
    throw new Error(`hex inválido: ${hex}`)
  }
  const [r, g, b] = channels.map((pair) => {
    const value = parseInt(pair, 16) / 255
    return value <= 0.03928
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4)
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razão de contraste da WCAG. Mede LUMINÂNCIA — é cega para matiz. */
export function contrastRatio(a: string, b: string): number {
  const first = relativeLuminance(a)
  const second = relativeLuminance(b)
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('contrastRatio', () => {
  it('mede os extremos conhecidos', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 1)
    expect(contrastRatio('#7a7a7a', '#7a7a7a')).toBeCloseTo(1, 5)
  })

  it('recusa hex malformado em vez de devolver número errado', () => {
    expect(() => contrastRatio('#12345', '#000000')).toThrow('hex inválido')
  })
})

/** Piso da WCAG para elemento não textual — o caso dos pins. */
const UI = 3
/** Piso da WCAG para texto — o caso dos rótulos do mapa. */
const TEXTO = 4.5

function verificar(nome: string, palette: ThemePalette) {
  const { map, pin } = palette

  describe(`paleta ${nome}`, () => {
    /*
     * A RAZÃO DE O ADR 0019 EXISTIR.
     *
     * Os dois estados cheios só se distinguem por cor — "não visitado" se salva
     * por ser oco, mas estes dois não têm forma que os separe. Se este teste
     * falhar, o produto voltou a ter dois pins iguais para dois significados
     * opostos, e ninguém vai notar olhando.
     */
    it('visitado e quero-conhecer se separam por luz, não só por matiz', () => {
      expect(contrastRatio(pin.visited, pin.wanted)).toBeGreaterThanOrEqual(UI)
    })

    it('os três estados de pin se destacam do fundo do mapa', () => {
      expect(contrastRatio(pin.visited, map.background)).toBeGreaterThanOrEqual(UI)
      expect(contrastRatio(pin.wanted, map.background)).toBeGreaterThanOrEqual(UI)
      expect(contrastRatio(pin.unvisited, map.background)).toBeGreaterThanOrEqual(UI)
    })

    it('o miolo do pin oco se distingue da própria borda', () => {
      expect(contrastRatio(pin.hollow, pin.unvisited)).toBeGreaterThanOrEqual(UI)
    })

    /*
     * Contra o FUNDO, e não contra o miolo do pin.
     *
     * O anel de favorito e o de seleção são desenhados num raio maior que o do
     * pin (7–11 contra 3.5–6.5 em `layers.ts`): eles cercam o disco em vez de
     * pousar sobre ele, então quem passa por baixo do traço é o terreno.
     * Comparar com a cor do miolo mediria uma sobreposição que não existe.
     */
    it('o anel de seleção se destaca do fundo do mapa', () => {
      expect(contrastRatio(pin.bone, map.background)).toBeGreaterThanOrEqual(UI)
    })

    /*
     * Sem faixa entre sombra e realce não há modelagem, e serra vira mancha
     * chapada. Era 1.82:1 no escuro — as serras catarinenses não existiam.
     */
    it('o relevo tem faixa de modelagem suficiente para virar montanha', () => {
      expect(
        contrastRatio(map.hillshadeHighlight, map.hillshadeShadow),
      ).toBeGreaterThanOrEqual(UI)
    })

    it('rótulos são texto, e cumprem o piso de texto', () => {
      expect(contrastRatio(map.labelSmall, map.background)).toBeGreaterThanOrEqual(TEXTO)
      expect(contrastRatio(map.labelLarge, map.background)).toBeGreaterThanOrEqual(TEXTO)
      expect(contrastRatio(map.labelSmall, map.labelHalo)).toBeGreaterThanOrEqual(TEXTO)
    })

    /*
     * A estrada é o conteúdo (princípio 1 do arquivo da paleta), e os quatro
     * níveis precisam ser lidos como quatro. O que sobe é a DISTÂNCIA DO FUNDO,
     * e não a claridade — no tema claro a rodovia é a via mais escura.
     */
    it('a escada das quatro vias sobe de verdade', () => {
      const degraus = [
        map.roadLocal,
        map.roadCollector,
        map.roadArterial,
        map.roadHighway,
      ].map((via) => contrastRatio(via, map.background))

      for (let i = 1; i < degraus.length; i += 1) {
        expect(degraus[i]!).toBeGreaterThan(degraus[i - 1]!)
      }
      // A via local precisa existir: estava em 1.54:1, indistinguível do fundo.
      expect(degraus[0]!).toBeGreaterThanOrEqual(1.7)
      // E a rodovia precisa ser inequívoca.
      expect(degraus[3]!).toBeGreaterThanOrEqual(7)
    })

    it('a faixa central do traçado corta o asfalto em vez de somar a ele', () => {
      expect(
        contrastRatio(palette.trip.centerLine, palette.trip.asphalt),
      ).toBeGreaterThanOrEqual(UI)
    })
  })
}

verificar('escura', paletteFor('escuro'))
verificar('clara', paletteFor('claro'))
