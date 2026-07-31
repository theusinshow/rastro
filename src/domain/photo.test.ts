import { describe, expect, it } from 'vitest'
import {
  MAX_CAPTION_LENGTH,
  isAcceptedImageType,
  validateNewPhoto,
} from './photo'
import type { NewPhoto } from './photo'

function photo(overrides: Partial<NewPhoto> = {}): NewPhoto {
  return {
    placeId: 'p1',
    storagePath: 'u1/p1/abc.jpg',
    width: 2000,
    height: 1500,
    coordinates: null,
    takenOn: null,
    caption: null,
    ...overrides,
  }
}

describe('isAcceptedImageType', () => {
  it('aceita os três formatos que o navegador sabe ler e encolher', () => {
    expect(isAcceptedImageType('image/jpeg')).toBe(true)
    expect(isAcceptedImageType('image/png')).toBe(true)
    expect(isAcceptedImageType('image/webp')).toBe(true)
  })

  it('recusa HEIC, que quebra tanto o EXIF quanto o canvas', () => {
    expect(isAcceptedImageType('image/heic')).toBe(false)
    expect(isAcceptedImageType('image/heif')).toBe(false)
  })

  it('recusa qualquer coisa que não seja imagem', () => {
    expect(isAcceptedImageType('application/pdf')).toBe(false)
    expect(isAcceptedImageType('')).toBe(false)
  })
})

describe('validateNewPhoto', () => {
  it('aceita uma foto sem legenda, sem data e sem coordenada', () => {
    // Nulo nos três é o caso comum: foto antiga, sem EXIF, sem legenda.
    expect(validateNewPhoto(photo())).toEqual([])
  })

  it('recusa legenda longa demais', () => {
    const caption = 'x'.repeat(MAX_CAPTION_LENGTH + 1)
    expect(validateNewPhoto(photo({ caption }))).toContain('caption-too-long')
  })

  it('aceita legenda exatamente no limite', () => {
    const caption = 'x'.repeat(MAX_CAPTION_LENGTH)
    expect(validateNewPhoto(photo({ caption }))).toEqual([])
  })

  it('recusa dimensão ausente ou absurda', () => {
    expect(validateNewPhoto(photo({ width: 0 }))).toContain('invalid-dimensions')
    expect(validateNewPhoto(photo({ height: -1 }))).toContain(
      'invalid-dimensions',
    )
  })

  it('recusa caminho de armazenamento vazio', () => {
    expect(validateNewPhoto(photo({ storagePath: '  ' }))).toContain(
      'storage-path-required',
    )
  })
})
