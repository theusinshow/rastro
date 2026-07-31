import { describe, expect, it } from 'vitest'
import { buildStoragePath } from './storage-path'

describe('buildStoragePath', () => {
  it('põe o usuário no primeiro segmento', () => {
    // A política de RLS do Storage compara `(storage.foldername(name))[1]` com
    // `auth.uid()`. Mudar esta ordem quebraria a autorização em silêncio.
    const path = buildStoragePath('u-1', 'p-1', 'abc')

    expect(path.split('/')[0]).toBe('u-1')
    expect(path).toBe('u-1/p-1/abc.jpg')
  })

  it('sempre termina em .jpg, porque o canvas reencoda para JPEG', () => {
    expect(buildStoragePath('u', 'p', 'x').endsWith('.jpg')).toBe(true)
  })
})
