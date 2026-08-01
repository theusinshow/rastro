import { describe, expect, it } from 'vitest'
import {
  GEOLOCATION_MESSAGES,
  classifyGeolocationError,
  originLabelFrom,
} from './geolocation'

describe('classifyGeolocationError', () => {
  it('separa negada de indisponível — são ações diferentes para o usuário', () => {
    expect(classifyGeolocationError({ code: 1 })).toBe('negada')
    expect(classifyGeolocationError({ code: 2 })).toBe('indisponivel')
  })

  it('reconhece o tempo esgotado', () => {
    expect(classifyGeolocationError({ code: 3 })).toBe('demorou')
  })

  /*
   * O objeto vem de uma API do navegador, e navegadores divergem. Um código
   * desconhecido não pode virar exceção nem mensagem em branco: vira o rótulo
   * que não promete saber a causa.
   */
  it('cai em indisponível para qualquer coisa inesperada', () => {
    expect(classifyGeolocationError({ code: 99 })).toBe('indisponivel')
    expect(classifyGeolocationError(null)).toBe('indisponivel')
    expect(classifyGeolocationError(undefined)).toBe('indisponivel')
    expect(classifyGeolocationError('erro')).toBe('indisponivel')
    expect(classifyGeolocationError({})).toBe('indisponivel')
  })

  it('toda falha tem mensagem, e nenhuma manda o usuário para o vazio', () => {
    for (const falha of [
      'sem-suporte',
      'negada',
      'indisponivel',
      'demorou',
    ] as const) {
      const mensagem = GEOLOCATION_MESSAGES[falha]
      expect(mensagem.length).toBeGreaterThan(20)
      // Toda mensagem aponta a saída que sempre funciona: buscar o endereço.
      expect(mensagem.toLowerCase()).toContain('endereço')
    }
  })
})

describe('originLabelFrom', () => {
  it('usa o nome quando ele existe', () => {
    expect(originLabelFrom('Palhoça, Santa Catarina')).toBe(
      'Palhoça, Santa Catarina',
    )
  })

  it('não deixa a origem sem nome quando a geocodificação falha', () => {
    expect(originLabelFrom(null)).toBe('Minha localização')
    expect(originLabelFrom('')).toBe('Minha localização')
    expect(originLabelFrom('   ')).toBe('Minha localização')
  })
})
