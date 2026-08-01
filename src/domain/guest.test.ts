import { describe, expect, it } from 'vitest'
import { canUploadPhotos } from './guest'
import type { Viewer } from './guest'

function viewer(overrides: Partial<Viewer> = {}): Viewer {
  return { isGuest: false, ...overrides }
}

describe('canUploadPhotos', () => {
  it('libera quem entrou com conta', () => {
    expect(canUploadPhotos(viewer())).toBe(true)
  })

  it('recusa o visitante sem conta', () => {
    expect(canUploadPhotos(viewer({ isGuest: true }))).toBe(false)
  })
})
