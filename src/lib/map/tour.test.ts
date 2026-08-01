import { describe, expect, it } from 'vitest'
import {
  FLY_MS,
  HOLD_MS,
  TOUR_INSTRUMENT,
  TOUR_SCENERY,
  tourShotFor,
} from './tour'

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
   * Chegar sempre pelo mesmo lado faz lugares diferentes parecerem o mesmo
   * lugar. Este teste falha se alguém fixar o ângulo.
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

describe('perfil de instrumento', () => {
  /*
   * A razão de existir um segundo perfil.
   *
   * `MapCanvas` desliga a rotação PARA O USUÁRIO — o norte fixo é decisão de
   * cartografia. Um passeio que gira dentro do app deixaria o mapa torto no
   * instante em que a pessoa tocasse nele, e ela não teria como endireitar.
   */
  it('não gira: o norte é fixo dentro do aplicativo', () => {
    for (const i of [0, 1, 2, 3, 17]) {
      expect(tourShotFor(SERRA, i, TOUR_INSTRUMENT).bearing).toBe(0)
    }
  })

  it('não inclina: não há o que desfazer quando o gesto interrompe', () => {
    expect(tourShotFor(SERRA, 0, TOUR_INSTRUMENT).pitch).toBe(0)
  })

  it('não liga o relevo 3D, ao contrário do cenário da entrada', () => {
    expect(TOUR_INSTRUMENT.terrainExaggeration).toBeNull()
    expect(TOUR_SCENERY.terrainExaggeration).not.toBeNull()
  })

  it('abre mais que o da entrada: apresenta o catálogo, não um lugar', () => {
    expect(TOUR_INSTRUMENT.zoom).toBeLessThan(TOUR_SCENERY.zoom)
  })

  it('continua apontando para o lugar certo, em lng/lat', () => {
    expect(tourShotFor(SERRA, 2, TOUR_INSTRUMENT).center).toEqual([
      SERRA.longitude,
      SERRA.latitude,
    ])
  })

  it('o perfil de cenário continua sendo o padrão', () => {
    expect(tourShotFor(SERRA, 0)).toEqual(tourShotFor(SERRA, 0, TOUR_SCENERY))
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
