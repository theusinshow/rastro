import { describe, expect, it } from 'vitest'
import {
  MAX_NOTE_LENGTH,
  RATING_LABELS,
  isValidRating,
  normalizeNote,
} from './review'

describe('isValidRating', () => {
  it('aceita de 1 a 5', () => {
    for (const n of [1, 2, 3, 4, 5]) expect(isValidRating(n)).toBe(true)
  })

  it('aceita nulo: não dar nota é uma resposta', () => {
    // Nem toda viagem pede julgamento. Forçar uma nota transformaria o relato
    // num formulário obrigatório.
    expect(isValidRating(null)).toBe(true)
  })

  it('recusa fora da faixa e o que não é inteiro', () => {
    expect(isValidRating(0)).toBe(false)
    expect(isValidRating(6)).toBe(false)
    expect(isValidRating(3.5)).toBe(false)
    expect(isValidRating(Number.NaN)).toBe(false)
  })
})

describe('normalizeNote', () => {
  it('apara os espaços das pontas', () => {
    expect(normalizeNote('  subiu com neblina  ')).toBe('subiu com neblina')
  })

  it('texto vazio ou só espaços vira nulo', () => {
    // Nulo e string vazia significam a mesma coisa — "não escrevi nada" — e
    // guardar as duas faria toda leitura precisar tratar os dois casos.
    expect(normalizeNote('')).toBeNull()
    expect(normalizeNote('   ')).toBeNull()
    expect(normalizeNote(null)).toBeNull()
  })

  it('corta no limite em vez de recusar o que foi escrito', () => {
    // Perder o fim de um relato longo é ruim; perder o relato inteiro por causa
    // de um erro de validação é pior.
    const longo = 'x'.repeat(MAX_NOTE_LENGTH + 50)

    expect(normalizeNote(longo)).toHaveLength(MAX_NOTE_LENGTH)
  })

  it('preserva quebras de linha do meio', () => {
    expect(normalizeNote('linha um\nlinha dois')).toBe('linha um\nlinha dois')
  })
})

describe('RATING_LABELS', () => {
  it('nomeia as cinco notas, para a estrela não ficar sem sentido', () => {
    expect(Object.keys(RATING_LABELS)).toHaveLength(5)
    expect(RATING_LABELS[5]).toBeTruthy()
  })
})
