import { describe, expect, it } from 'vitest'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { usable } from './camera'

/**
 * `usable` só chama `map.getCanvas()`, então o dublê precisa apenas disso —
 * não é preciso montar um `MapLibreMap` de verdade para testar uma função pura
 * de números.
 */
function mapWithCanvas(clientWidth: number, clientHeight: number): MapLibreMap {
  return {
    getCanvas: () => ({ clientWidth, clientHeight }),
  } as unknown as MapLibreMap
}

describe('usable', () => {
  it('mantém o padding quando ele cabe nos dois eixos', () => {
    const map = mapWithCanvas(1512, 945)
    expect(usable(map, { left: 272, right: 340, top: 60, bottom: 40 })).toEqual({
      left: 272,
      right: 340,
      top: 60,
      bottom: 40,
    })
  })

  it('descarta os dois lados do eixo horizontal quando o padding não cabe', () => {
    // Largura 1000: limiar é 700. 350 + 350 = 700, que não é < 700.
    const map = mapWithCanvas(1000, 1000)
    expect(usable(map, { left: 350, right: 350, top: 10, bottom: 10 })).toEqual({
      left: 0,
      right: 0,
      top: 10,
      bottom: 10,
    })
  })

  it('mantém o padding horizontal um passo abaixo do limiar', () => {
    // 349 + 350 = 699, que é < 700: cabe.
    const map = mapWithCanvas(1000, 1000)
    expect(usable(map, { left: 349, right: 350, top: 10, bottom: 10 })).toEqual({
      left: 349,
      right: 350,
      top: 10,
      bottom: 10,
    })
  })

  it('descarta os dois lados do eixo vertical quando o padding não cabe', () => {
    // Altura 1000: limiar é 700. 400 + 300 = 700, que não é < 700.
    const map = mapWithCanvas(1000, 1000)
    expect(usable(map, { left: 10, right: 10, top: 400, bottom: 300 })).toEqual({
      left: 10,
      right: 10,
      top: 0,
      bottom: 0,
    })
  })

  it('mantém o padding vertical um passo abaixo do limiar', () => {
    // 400 + 299 = 699, que é < 700: cabe.
    const map = mapWithCanvas(1000, 1000)
    expect(usable(map, { left: 10, right: 10, top: 400, bottom: 299 })).toEqual({
      left: 10,
      right: 10,
      top: 400,
      bottom: 299,
    })
  })

  it('descarta um eixo sem afetar o outro — tudo ou nada é por eixo', () => {
    // Folha inferior de celular: padding horizontal de desktop não cabe,
    // vertical continua cabendo.
    const map = mapWithCanvas(390, 844)
    expect(usable(map, { left: 272, right: 340, top: 60, bottom: 40 })).toEqual({
      left: 0,
      right: 0,
      top: 60,
      bottom: 40,
    })
  })

  it('trata campos ausentes como zero', () => {
    const map = mapWithCanvas(1000, 1000)
    expect(usable(map, { top: 5 })).toEqual({ left: 0, right: 0, top: 5, bottom: 0 })
  })
})
