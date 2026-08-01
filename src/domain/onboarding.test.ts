import { describe, expect, it } from 'vitest'
import { ORIGIN_SETUP_PATH, destinationAfterEntry } from './onboarding'

describe('destinationAfterEntry', () => {
  it('sem origem, a entrada cai na tela que pergunta de onde você sai', () => {
    expect(destinationAfterEntry({ hasOrigin: false, requested: '/' })).toBe(
      ORIGIN_SETUP_PATH,
    )
  })

  it('com origem, vai direto para o mapa', () => {
    // A pergunta é de primeira vez, não de toda vez.
    expect(destinationAfterEntry({ hasOrigin: true, requested: '/' })).toBe('/')
  })

  it('não sequestra quem entrou para chegar a outro lugar', () => {
    // Quem foi barrado tentando abrir uma viagem e entrou para chegar lá
    // continua chegando lá. Trocar isso pela nossa pergunta seria trocar a
    // intenção da pessoa pela nossa.
    expect(
      destinationAfterEntry({ hasOrigin: false, requested: '/viagens/serra' }),
    ).toBe('/viagens/serra')

    expect(
      destinationAfterEntry({ hasOrigin: true, requested: '/memorias' }),
    ).toBe('/memorias')
  })

  it('não entra em laço: quem já está na tela de origem fica nela', () => {
    expect(
      destinationAfterEntry({
        hasOrigin: false,
        requested: ORIGIN_SETUP_PATH,
      }),
    ).toBe(ORIGIN_SETUP_PATH)
  })
})
