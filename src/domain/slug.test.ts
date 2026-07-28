import { describe, expect, it } from 'vitest'
import { slugify, uniqueSlug } from './slug'

describe('slugify', () => {
  it('normaliza acentos, caixa e espaço', () => {
    expect(slugify('Serra do Rio do Rastro')).toBe('serra-do-rio-do-rastro')
    expect(slugify('Grão-Pará')).toBe('grao-para')
    expect(slugify('Praia  do   Rosa')).toBe('praia-do-rosa')
  })

  it('descarta pontuação e apara hifens das pontas', () => {
    expect(slugify('  — Café do Mirante! ')).toBe('cafe-do-mirante')
  })

  it('devolve string vazia quando não sobra nada', () => {
    expect(slugify('!!!')).toBe('')
  })
})

describe('uniqueSlug', () => {
  it('devolve a base quando ela está livre', () => {
    expect(uniqueSlug('mirante', ['praia'])).toBe('mirante')
  })

  it('acrescenta sufixo numérico na primeira colisão', () => {
    expect(uniqueSlug('mirante', ['mirante'])).toBe('mirante-2')
  })

  it('pula sufixos já tomados', () => {
    expect(uniqueSlug('mirante', ['mirante', 'mirante-2', 'mirante-3'])).toBe(
      'mirante-4',
    )
  })

  // Um nome só de pontuação não pode virar slug vazio: `slug` é `not null unique`
  // no banco, e dois lugares assim colidiriam na string vazia.
  it('usa uma base neutra quando a base é vazia', () => {
    expect(uniqueSlug('', [])).toBe('lugar')
    expect(uniqueSlug('', ['lugar'])).toBe('lugar-2')
  })
})
