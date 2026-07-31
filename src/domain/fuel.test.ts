import { describe, expect, it } from 'vitest'
import {
  MAX_AUTONOMY_KM,
  MIN_AUTONOMY_KM,
  REFUEL_SAFETY_MARGIN,
  isValidAutonomy,
  planRefuelStops,
  pointAtDistance,
} from './fuel'

describe('isValidAutonomy', () => {
  it('aceita a faixa plausível de uma moto', () => {
    expect(isValidAutonomy(180)).toBe(true)
    expect(isValidAutonomy(300)).toBe(true)
    expect(isValidAutonomy(450)).toBe(true)
  })

  it('recusa fora da faixa, e recusa o que não é número inteiro', () => {
    expect(isValidAutonomy(MIN_AUTONOMY_KM - 1)).toBe(false)
    expect(isValidAutonomy(MAX_AUTONOMY_KM + 1)).toBe(false)
    expect(isValidAutonomy(0)).toBe(false)
    expect(isValidAutonomy(-100)).toBe(false)
    expect(isValidAutonomy(280.5)).toBe(false)
    expect(isValidAutonomy(Number.NaN)).toBe(false)
  })
})

describe('planRefuelStops', () => {
  it('sem autonomia informada, não opina', () => {
    // Nulo é "não sei qual é a sua moto". Chutar uma autonomia média seria
    // inventar dado sobre o veículo de outra pessoa.
    expect(planRefuelStops(379, null)).toBeNull()
  })

  it('volta que cabe no tanque não pede parada', () => {
    const plano = planRefuelStops(200, 300)

    expect(plano?.stops).toBe(0)
    expect(plano?.fitsInOneTank).toBe(true)
  })

  it('usa margem de segurança: 260 km numa moto de 300 já pede parada', () => {
    // Rodar até a última gota não é plano, é aposta. Com 15% de margem, a
    // autonomia útil de uma moto de 300 km é 255.
    const plano = planRefuelStops(260, 300)

    expect(plano?.fitsInOneTank).toBe(false)
    expect(plano?.stops).toBe(1)
  })

  it('379 km numa moto de 300 pede uma parada', () => {
    const plano = planRefuelStops(379, 300)

    expect(plano?.stops).toBe(1)
    expect(plano?.usableRangeKm).toBe(Math.round(300 * REFUEL_SAFETY_MARGIN))
  })

  it('volta muito longa pede mais de uma parada', () => {
    // 800 km com 255 úteis: 255, 510, 765 — três reabastecimentos.
    expect(planRefuelStops(800, 300)?.stops).toBe(3)
  })

  it('marca a quilometragem de cada parada', () => {
    const plano = planRefuelStops(600, 300)

    expect(plano?.atKm).toEqual([255, 510])
  })
})

describe('pointAtDistance', () => {
  // Linha reta ao longo do equador: 1 grau de longitude ≈ 111,32 km.
  const linha: [number, number][] = [
    [0, 0],
    [1, 0],
    [2, 0],
  ]

  it('devolve o começo para distância zero', () => {
    const p = pointAtDistance(linha, 0)

    expect(p?.longitude).toBeCloseTo(0, 4)
    expect(p?.latitude).toBeCloseTo(0, 4)
  })

  it('encontra o meio do primeiro trecho', () => {
    const p = pointAtDistance(linha, 55.66)

    expect(p?.longitude).toBeCloseTo(0.5, 2)
  })

  it('atravessa para o segundo trecho', () => {
    const p = pointAtDistance(linha, 166.98)

    expect(p?.longitude).toBeCloseTo(1.5, 2)
  })

  it('distância além do fim devolve null, e nunca extrapola', () => {
    // Extrapolar inventaria um ponto fora da rota, e o mapa marcaria o tanque
    // acabando num lugar por onde ninguém passa.
    expect(pointAtDistance(linha, 10_000)).toBeNull()
  })

  it('linha com menos de dois pontos não tem posição nenhuma', () => {
    expect(pointAtDistance([[0, 0]], 1)).toBeNull()
    expect(pointAtDistance([], 0)).toBeNull()
  })
})
