import { describe, expect, it } from 'vitest'
import { toPhotoFromRow } from './photo-row'
import type { PhotoRow } from './photo-row'

function row(overrides: Partial<PhotoRow> = {}): PhotoRow {
  return {
    id: 'f1',
    place_id: 'p1',
    trip_id: null,
    storage_path: 'u1/p1/abc.jpg',
    width: 2000,
    height: 1500,
    latitude: null,
    longitude: null,
    taken_on: null,
    caption: null,
    sort_index: 0,
    ...overrides,
  }
}

describe('toPhotoFromRow', () => {
  it('sem coordenada no banco, devolve null em vez de zero-zero', () => {
    // Zero-zero é um ponto no golfo da Guiné. Fingir coordenada colocaria a foto
    // no meio do Atlântico.
    expect(toPhotoFromRow(row()).coordinates).toBeNull()
  })

  it('monta a coordenada quando as duas colunas existem', () => {
    const photo = toPhotoFromRow(row({ latitude: -28.38, longitude: -49.42 }))

    expect(photo.coordinates).toEqual({ latitude: -28.38, longitude: -49.42 })
  })

  it('data ausente continua nula, e NUNCA vira a data de hoje', () => {
    // Regra do produto: nulo é "não sabemos quando foi tirada". Preencher com
    // hoje seria inventar memória.
    expect(toPhotoFromRow(row({ taken_on: null })).takenOn).toBeNull()
  })

  it('preserva a data quando ela existe', () => {
    expect(toPhotoFromRow(row({ taken_on: '2024-03-15' })).takenOn).toBe(
      '2024-03-15',
    )
  })

  it('foto sem viagem é o caso comum, e chega com tripId nulo', () => {
    expect(toPhotoFromRow(row()).tripId).toBeNull()
  })
})
