import { describe, expect, it } from 'vitest'
import { FLY_MS, HOLD_MS, tourShotFor } from './tour'

const SERRA = { latitude: -28.39, longitude: -49.54 }

describe('tourShotFor', () => {
  it('aponta a câmera para o lugar, em lng/lat', () => {
    const shot = tourShotFor(SERRA, 0)
    // O MapLibre inverte a ordem, e trocar os dois não dá erro: leva a câmera
    // para o meio do oceano, calada.
    expect(shot.center).toEqual([SERRA.longitude, SERRA.latitude])
  })

  it('chega inclinada, senão não há montanha para ver', () => {
    expect(tourShotFor(SERRA, 0).pitch).toBeGreaterThan(30)
  })

  /*
   * Chegar sempre pelo mesmo lado faz catorze lugares diferentes parecerem o
   * mesmo lugar. Este teste falha se alguém fixar o ângulo.
   */
  it('varia o ângulo de aproximação entre lugares vizinhos', () => {
    const angulos = [0, 1, 2, 3].map((i) => tourShotFor(SERRA, i).bearing)
    expect(new Set(angulos).size).toBe(4)
  })

  it('é determinística — o mesmo índice devolve a mesma câmera', () => {
    expect(tourShotFor(SERRA, 7)).toEqual(tourShotFor(SERRA, 7))
  })

  it('dá a volta no rodízio em vez de sair da lista', () => {
    expect(tourShotFor(SERRA, 4).bearing).toBe(tourShotFor(SERRA, 0).bearing)
    expect(Number.isFinite(tourShotFor(SERRA, 99).bearing)).toBe(true)
  })
})

describe('ritmo do passeio', () => {
  /*
   * A parada existe para dar tempo de LER o painel — nome, categoria e a linha
   * escrita à mão. Uma parada mais curta que a leitura transforma informação em
   * piscada.
   */
  it('para tempo suficiente para ler o painel', () => {
    expect(HOLD_MS).toBeGreaterThanOrEqual(3_000)
  })

  it('o voo é lento o bastante para acompanhar o trajeto', () => {
    expect(FLY_MS).toBeGreaterThanOrEqual(3_000)
  })
})
