import { describe, expect, it } from 'vitest'
import {
  formatCoordinate,
  formatDistanceKm,
  formatDurationMinutes,
  haversineKm,
} from './geo'

const PALHOCA = { latitude: -27.6455, longitude: -48.67 }
const FLORIANOPOLIS = { latitude: -27.5954, longitude: -48.548 }

describe('haversineKm', () => {
  it('retorna zero para o mesmo ponto', () => {
    expect(haversineKm(PALHOCA, PALHOCA)).toBe(0)
  })

  it('calcula a distância entre Palhoça e Florianópolis', () => {
    expect(haversineKm(PALHOCA, FLORIANOPOLIS)).toBeCloseTo(13.2, 0)
  })

  it('é simétrico', () => {
    const ida = haversineKm(PALHOCA, FLORIANOPOLIS)
    const volta = haversineKm(FLORIANOPOLIS, PALHOCA)
    expect(ida).toBeCloseTo(volta, 6)
  })

  it('atravessa o antimeridiano pelo caminho curto', () => {
    const oeste = { latitude: 0, longitude: 179.5 }
    const leste = { latitude: 0, longitude: -179.5 }
    expect(haversineKm(oeste, leste)).toBeLessThan(120)
  })
})

describe('formatCoordinate', () => {
  it('usa quatro casas decimais e mantém o sinal', () => {
    expect(formatCoordinate(-27.6455)).toBe('-27.6455')
  })

  it('preenche casas faltantes', () => {
    expect(formatCoordinate(-27.6)).toBe('-27.6000')
  })
})

describe('formatDistanceKm', () => {
  it('arredonda para inteiro acima de 10 km', () => {
    expect(formatDistanceKm(412.4)).toBe('412')
  })

  it('mantém uma casa decimal abaixo de 10 km', () => {
    expect(formatDistanceKm(7.24)).toBe('7,2')
  })
})

describe('formatDurationMinutes', () => {
  it('formata horas e minutos', () => {
    expect(formatDurationMinutes(512)).toBe('8h32')
  })

  it('omite as horas quando não há', () => {
    expect(formatDurationMinutes(45)).toBe('45min')
  })

  it('zera os minutos com dois dígitos', () => {
    expect(formatDurationMinutes(120)).toBe('2h00')
  })
})
