import { describe, expect, it } from 'vitest'
import {
  buildElevationProfile,
  formatMeters,
  type ElevationSample,
} from './elevation'
import type { RoutePosition } from './geo'

/** Uma linha reta indo para leste, um ponto a cada ~1 km, na altitude dada. */
function line(elevations: readonly number[]): RoutePosition[] {
  return elevations.map((meters, index) => [
    -48.67 + index * 0.01,
    -27.6455,
    meters,
  ])
}

describe('buildElevationProfile', () => {
  it('devolve null quando o traçado não traz altitude', () => {
    // É o caso de toda viagem gravada antes de o roteador pedir altimetria.
    const pares: RoutePosition[] = [
      [-48.67, -27.64],
      [-48.66, -27.64],
    ]
    expect(buildElevationProfile(pares)).toBeNull()
  })

  it('devolve null quando só um ponto tem altitude', () => {
    const misto: RoutePosition[] = [
      [-48.67, -27.64, 10],
      [-48.66, -27.64],
    ]
    expect(buildElevationProfile(misto)).toBeNull()
  })

  it('devolve null com menos de dois pontos', () => {
    expect(buildElevationProfile(line([10]))).toBeNull()
    expect(buildElevationProfile([])).toBeNull()
  })

  it('registra o ponto mais alto e o mais baixo', () => {
    const profile = buildElevationProfile(line([420, 1822, 900]))

    expect(profile?.highestM).toBe(1822)
    expect(profile?.lowestM).toBe(420)
  })

  it('o desnível é a diferença entre os dois, e não uma soma', () => {
    // Sobe, desce e sobe de novo: quem acumula diria 1.700 m. O desnível da
    // viagem é 1.500, e é ele que a leitura do modelo sustenta.
    const profile = buildElevationProfile(line([0, 500, 1500, 1000, 1200]))

    expect(profile?.climbM).toBe(1500)
  })

  // Uma planície não pode "ganhar" uma serra pela tremida do modelo de elevação.
  it('trecho plano tem desnível de trecho plano', () => {
    const plano = line([10, 12, 9, 13, 8, 11, 10, 12, 9])
    const profile = buildElevationProfile(plano)

    expect(profile?.climbM).toBe(5)
  })

  it('acumula a distância ao longo do traçado', () => {
    const profile = buildElevationProfile(line([0, 100, 200]))

    expect(profile?.samples[0]?.km).toBe(0)
    expect(profile?.totalKm).toBeGreaterThan(1)
    expect(profile?.samples.at(-1)?.km).toBeCloseTo(profile?.totalKm ?? -1, 6)
  })

  it('reduz a série para o que cabe na tela', () => {
    const longa = line(Array.from({ length: 4000 }, (_, i) => 500 + (i % 7)))
    const profile = buildElevationProfile(longa)

    expect(profile?.samples.length).toBeLessThanOrEqual(140)
    expect(profile?.samples.length).toBeGreaterThan(100)
  })

  // O motivo de existir a redução por triângulo, e não "um ponto a cada N".
  it('preserva o cume ao reduzir', () => {
    const elevations = Array.from({ length: 2000 }, () => 900)
    elevations[977] = 1822
    const profile = buildElevationProfile(line(elevations))
    const desenhado = profile?.samples.map((s: ElevationSample) => s.meters) ?? []

    expect(Math.max(...desenhado)).toBe(1822)
  })

  it('mantém o primeiro e o último ponto', () => {
    const elevations = Array.from({ length: 3000 }, (_, i) => 100 + i * 0.1)
    const profile = buildElevationProfile(line(elevations))

    expect(profile?.samples[0]?.meters).toBe(100)
    expect(profile?.samples.at(-1)?.meters).toBeCloseTo(100 + 2999 * 0.1, 6)
  })
})

describe('formatMeters', () => {
  it('separa milhar e não inventa decimal', () => {
    expect(formatMeters(1822)).toBe('1.822')
    expect(formatMeters(420.6)).toBe('421')
  })
})
