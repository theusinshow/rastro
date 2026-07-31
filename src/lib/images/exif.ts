import type { Coordinates } from '@/domain/geo'

export interface ExifData {
  coordinates: Coordinates | null
  /** Data civil `YYYY-MM-DD`. Nulo quando o arquivo não diz. */
  takenOn: string | null
}

const VAZIO: ExifData = { coordinates: null, takenOn: null }

const TAG_GPS_IFD = 0x8825
const TAG_EXIF_IFD = 0x8769
const TAG_GPS_LAT_REF = 0x0001
const TAG_GPS_LAT = 0x0002
const TAG_GPS_LNG_REF = 0x0003
const TAG_GPS_LNG = 0x0004
const TAG_DATE_TAKEN = 0x9003

interface Entry {
  type: number
  count: number
  at: number
}

/** Graus, minutos e segundos viram grau decimal. */
function toDegrees(dms: number[], ref: string): number | null {
  const [d, m, s] = dms
  if (d === undefined || m === undefined || s === undefined) return null
  const value = d + m / 60 + s / 3600
  // Sul e Oeste são negativos. Sem isto, uma foto de Santa Catarina cairia na
  // Ucrânia.
  return ref === 'S' || ref === 'W' ? -value : value
}

/** `'2024:03:15 08:42:11'` → `'2024-03-15'`. Nulo se não casar. */
function toCivilDate(exifDate: string): string | null {
  const match = /^(\d{4}):(\d{2}):(\d{2})/.exec(exifDate)
  if (!match) return null
  return `${match[1]}-${match[2]}-${match[3]}`
}

/**
 * Lê GPS e data de um JPEG. Quatro tags, nada mais.
 *
 * **NUNCA lança**: arquivo sem EXIF, truncado, corrompido ou que nem é JPEG
 * devolve os dois nulos. Foto sem metadado é caso comum, não erro — e nulo é
 * exatamente o que o domínio espera para "não sabemos".
 *
 * Escrito à mão em vez de trazer um pacote: são quatro tags, e o ADR 0001 prefere
 * código próprio a um wrapper.
 */
export function readExif(buffer: ArrayBuffer): ExifData {
  try {
    const view = new DataView(buffer)
    if (view.byteLength < 4) return VAZIO
    if (view.getUint16(0) !== 0xffd8) return VAZIO // não é JPEG

    // Procura o segmento APP1 que começa com "Exif\0\0".
    let offset = 2
    let tiff = -1
    while (offset + 4 <= view.byteLength) {
      const marker = view.getUint16(offset)
      if ((marker & 0xff00) !== 0xff00) break
      const size = view.getUint16(offset + 2)
      if (
        marker === 0xffe1 &&
        offset + 10 <= view.byteLength &&
        view.getUint32(offset + 4) === 0x45786966
      ) {
        tiff = offset + 10
        break
      }
      offset += 2 + size
    }
    if (tiff < 0 || tiff + 8 > view.byteLength) return VAZIO

    // `II` é little-endian, `MM` é big-endian. As duas existem no mundo real, e
    // assumir uma delas erraria metade das fotos.
    const little = view.getUint16(tiff) === 0x4949
    const u16 = (at: number) => view.getUint16(at, little)
    const u32 = (at: number) => view.getUint32(at, little)

    if (u16(tiff + 2) !== 42) return VAZIO

    const readIfd = (start: number): Map<number, Entry> => {
      const out = new Map<number, Entry>()
      if (start + 2 > view.byteLength) return out
      const count = u16(start)
      for (let i = 0; i < count; i += 1) {
        const entry = start + 2 + i * 12
        if (entry + 12 > view.byteLength) break
        out.set(u16(entry), {
          type: u16(entry + 2),
          count: u32(entry + 4),
          at: entry + 8,
        })
      }
      return out
    }

    const readAscii = (entry: Entry): string => {
      // Até 4 bytes cabem no próprio campo; acima disso ele guarda um offset.
      const start = entry.count <= 4 ? entry.at : tiff + u32(entry.at)
      let out = ''
      for (let i = 0; i < entry.count && start + i < view.byteLength; i += 1) {
        const code = view.getUint8(start + i)
        if (code === 0) break
        out += String.fromCharCode(code)
      }
      return out
    }

    const readRationals = (entry: Entry): number[] => {
      const start = tiff + u32(entry.at)
      const out: number[] = []
      for (let i = 0; i < entry.count; i += 1) {
        const at = start + i * 8
        if (at + 8 > view.byteLength) break
        const denominator = u32(at + 4)
        out.push(denominator === 0 ? 0 : u32(at) / denominator)
      }
      return out
    }

    const ifd0 = readIfd(tiff + u32(tiff + 4))

    let takenOn: string | null = null
    const exifPointer = ifd0.get(TAG_EXIF_IFD)
    if (exifPointer) {
      const taken = readIfd(tiff + u32(exifPointer.at)).get(TAG_DATE_TAKEN)
      if (taken) takenOn = toCivilDate(readAscii(taken))
    }

    let coordinates: Coordinates | null = null
    const gpsPointer = ifd0.get(TAG_GPS_IFD)
    if (gpsPointer) {
      const gps = readIfd(tiff + u32(gpsPointer.at))
      const lat = gps.get(TAG_GPS_LAT)
      const lng = gps.get(TAG_GPS_LNG)
      const latRef = gps.get(TAG_GPS_LAT_REF)
      const lngRef = gps.get(TAG_GPS_LNG_REF)

      if (lat && lng && latRef && lngRef) {
        const latitude = toDegrees(readRationals(lat), readAscii(latRef))
        const longitude = toDegrees(readRationals(lng), readAscii(lngRef))
        if (
          latitude !== null &&
          longitude !== null &&
          Math.abs(latitude) <= 90 &&
          Math.abs(longitude) <= 180
        ) {
          coordinates = { latitude, longitude }
        }
      }
    }

    return { coordinates, takenOn }
  } catch {
    // Binário malformado não é falha da aplicação: é uma foto sem metadado.
    return VAZIO
  }
}
