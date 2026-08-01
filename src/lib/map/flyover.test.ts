import { describe, expect, it } from 'vitest'
import { LANDING, SHOTS, shotAt } from './flyover'

describe('shotAt', () => {
  it('no início entrega o primeiro plano, inteiro', () => {
    expect(shotAt(0)).toEqual(SHOTS[0])
  })

  it('no fim entrega o pouso, inteiro', () => {
    expect(shotAt(1)).toEqual(LANDING)
  })

  it('o último plano é o pouso: plano, sem giro', () => {
    expect(LANDING.pitch).toBe(0)
    expect(LANDING.bearing).toBe(0)
    expect(SHOTS.at(-1)).toEqual(LANDING)
  })

  it('interpola no meio de dois planos', () => {
    const shots = [
      { longitude: 0, latitude: 0, zoom: 8, pitch: 60, bearing: -30 },
      { longitude: 2, latitude: 4, zoom: 10, pitch: 40, bearing: 10 },
    ]

    expect(shotAt(0.5, shots)).toEqual({
      longitude: 1,
      latitude: 2,
      zoom: 9,
      pitch: 50,
      bearing: -10,
    })
  })

  it('atravessa três planos usando o trecho certo', () => {
    const shots = [
      { longitude: 0, latitude: 0, zoom: 0, pitch: 0, bearing: 0 },
      { longitude: 10, latitude: 0, zoom: 0, pitch: 0, bearing: 0 },
      { longitude: 20, latitude: 0, zoom: 0, pitch: 0, bearing: 0 },
    ]

    // 0.25 cai na metade do PRIMEIRO trecho, não a um quarto do caminho todo.
    expect(shotAt(0.25, shots).longitude).toBe(5)
    expect(shotAt(0.5, shots).longitude).toBe(10)
    expect(shotAt(0.75, shots).longitude).toBe(15)
  })

  /*
   * O `animateProgress` entrega no máximo 1, mas o easing é aplicado antes e
   * ponto flutuante às vezes devolve 1.0000000000000002. Sem o corte, o índice
   * do trecho passaria do fim do vetor e a interpolação leria `undefined`.
   */
  it('prende progresso fora da faixa em vez de sair do vetor', () => {
    expect(shotAt(-0.5)).toEqual(SHOTS[0])
    expect(shotAt(1.5)).toEqual(LANDING)
  })

  it('a serra tem ao menos três planos, senão não é sobrevoo', () => {
    expect(SHOTS.length).toBeGreaterThanOrEqual(3)
  })

  it('recusa um caminho curto demais para ser caminho', () => {
    expect(() => shotAt(0.5, [LANDING])).toThrow('ao menos dois planos')
  })

  it('começa inclinada, para haver montanha para ver', () => {
    expect(shotAt(0).pitch).toBeGreaterThan(30)
  })
})
