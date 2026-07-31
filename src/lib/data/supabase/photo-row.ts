import type { Photo } from '@/domain/photo'

export const PHOTO_SELECT = `
  id, place_id, trip_id, storage_path, width, height,
  latitude, longitude, taken_on, caption, sort_index
`

export interface PhotoRow {
  id: string
  place_id: string
  trip_id: string | null
  storage_path: string
  width: number
  height: number
  latitude: number | null
  longitude: number | null
  taken_on: string | null
  caption: string | null
  sort_index: number
}

export function toPhotoFromRow(row: PhotoRow): Photo {
  return {
    id: row.id,
    placeId: row.place_id,
    tripId: row.trip_id,
    storagePath: row.storage_path,
    width: row.width,
    height: row.height,
    // `null` explícito, nunca zero-zero: zero-zero é um ponto no golfo da Guiné,
    // e fingir coordenada colocaria a foto no meio do Atlântico.
    coordinates:
      row.latitude !== null && row.longitude !== null
        ? { latitude: row.latitude, longitude: row.longitude }
        : null,
    // Nulo passa direto: significa "não sabemos quando foi tirada". Preencher
    // com hoje seria inventar memória.
    takenOn: row.taken_on,
    caption: row.caption,
    sortIndex: row.sort_index,
  }
}
