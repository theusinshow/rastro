import { describe, expect, it } from 'vitest'
import { MAX_EDGE_PX, targetDimensions } from './resize'

/**
 * Só `targetDimensions`. O `canvas` não existe no ambiente de teste do Vitest,
 * então a casca que desenha fica coberta pela verificação visual — e é por isso
 * que a conta foi extraída: ela é a parte que tem regra para errar.
 */
describe('targetDimensions', () => {
  it('encolhe paisagem pelo lado maior, preservando a proporção', () => {
    const r = targetDimensions(4000, 3000)

    expect(r.width).toBe(MAX_EDGE_PX)
    expect(r.height).toBe(Math.round((MAX_EDGE_PX * 3000) / 4000))
  })

  it('encolhe retrato pelo lado maior', () => {
    const r = targetDimensions(3000, 4000)

    expect(r.height).toBe(MAX_EDGE_PX)
    expect(r.width).toBe(Math.round((MAX_EDGE_PX * 3000) / 4000))
  })

  it('NÃO amplia imagem menor que o limite', () => {
    // Ampliar inventaria pixels e engordaria o arquivo sem ganhar nada.
    expect(targetDimensions(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('imagem exatamente no limite fica intacta', () => {
    expect(targetDimensions(MAX_EDGE_PX, 100)).toEqual({
      width: MAX_EDGE_PX,
      height: 100,
    })
  })

  it('nunca devolve zero', () => {
    // Uma faixa muito estreita arredondaria para zero, e canvas de altura zero
    // não desenha nada.
    expect(targetDimensions(10000, 1).height).toBeGreaterThanOrEqual(1)
  })
})
