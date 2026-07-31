import { describe, expect, it } from 'vitest'
import { readExif } from './exif'

/**
 * Monta um JPEG mínimo com bloco EXIF: SOI + APP1(Exif/TIFF) + EOI.
 *
 * O construtor vive aqui, e não como arquivo binário no repositório, porque um
 * fixture `.jpg` seria opaco: ninguém diria o que ele contém sem abrir um editor
 * hexadecimal. Aqui o layout está escrito.
 *
 * `big` escolhe a ordem de bytes do TIFF (`MM` grande, `II` pequena), que é a
 * armadilha central do formato: as duas existem no mundo real, e um leitor que
 * assume uma delas erra metade das fotos.
 */
function buildJpegWithExif(options: {
  big: boolean
  lat?: [number, number, number]
  latRef?: string
  lng?: [number, number, number]
  lngRef?: string
  taken?: string
}): ArrayBuffer {
  const { big } = options
  const body: number[] = []

  const push16 = (out: number[], v: number) =>
    big ? out.push((v >> 8) & 0xff, v & 0xff) : out.push(v & 0xff, (v >> 8) & 0xff)
  const push32 = (out: number[], v: number) =>
    big
      ? out.push(
          (v >>> 24) & 0xff,
          (v >>> 16) & 0xff,
          (v >>> 8) & 0xff,
          v & 0xff,
        )
      : out.push(
          v & 0xff,
          (v >>> 8) & 0xff,
          (v >>> 16) & 0xff,
          (v >>> 24) & 0xff,
        )

  // Layout fixo: IFD0 (2 entradas) + GPS IFD (4 ou 0) + Exif IFD (1 ou 0).
  // Os dados grandes (RATIONAL e ASCII) vão depois dos três.
  const gpsCount = options.lat ? 4 : 0
  const exifCount = options.taken ? 1 : 0
  const ifd0Size = 2 + 2 * 12 + 4
  const gpsSize = 2 + gpsCount * 12 + 4
  const exifSize = 2 + exifCount * 12 + 4
  const gpsOffset = 8 + ifd0Size
  const exifOffset = gpsOffset + gpsSize
  const extraBase = exifOffset + exifSize

  const extra: number[] = []

  const writeRationals = (r: [number, number, number]): number => {
    const offset = extraBase + extra.length
    for (const n of r) {
      // Denominador 1000 para caber minuto e segundo fracionários.
      push32(extra, Math.round(n * 1000))
      push32(extra, 1000)
    }
    return offset
  }

  const writeAscii = (s: string): number => {
    const offset = extraBase + extra.length
    for (const ch of s) extra.push(ch.charCodeAt(0))
    extra.push(0)
    return offset
  }

  const latOffset = options.lat ? writeRationals(options.lat) : 0
  const lngOffset = options.lng ? writeRationals(options.lng) : 0
  const takenOffset = options.taken ? writeAscii(options.taken) : 0

  // Cabeçalho TIFF.
  body.push(big ? 0x4d : 0x49, big ? 0x4d : 0x49)
  push16(body, 42)
  push32(body, 8)

  const entry = (tag: number, type: number, count: number, value: number) => {
    push16(body, tag)
    push16(body, type)
    push32(body, count)
    push32(body, value)
  }

  /** ASCII de 1 caractere cabe no próprio campo, alinhado à esquerda. */
  const entryChar = (tag: number, ch: string) => {
    push16(body, tag)
    push16(body, 2)
    push32(body, 2)
    body.push(ch.charCodeAt(0), 0, 0, 0)
  }

  // IFD0: só os dois ponteiros.
  push16(body, 2)
  entry(0x8825, 4, 1, gpsOffset)
  entry(0x8769, 4, 1, exifOffset)
  push32(body, 0)

  // GPS IFD.
  push16(body, gpsCount)
  if (options.lat) {
    entryChar(0x0001, options.latRef ?? 'S')
    entry(0x0002, 5, 3, latOffset)
    entryChar(0x0003, options.lngRef ?? 'W')
    entry(0x0004, 5, 3, lngOffset)
  }
  push32(body, 0)

  // Exif IFD.
  push16(body, exifCount)
  if (options.taken) entry(0x9003, 2, options.taken.length + 1, takenOffset)
  push32(body, 0)

  body.push(...extra)

  const exifHeader = [0x45, 0x78, 0x69, 0x66, 0, 0] // "Exif\0\0"
  const app1Length = 2 + exifHeader.length + body.length

  return new Uint8Array([
    0xff, 0xd8,
    0xff, 0xe1, (app1Length >> 8) & 0xff, app1Length & 0xff,
    ...exifHeader,
    ...body,
    0xff, 0xd9,
  ]).buffer
}

describe('readExif', () => {
  it('lê coordenada e data em ordem de bytes grande (MM)', () => {
    const buffer = buildJpegWithExif({
      big: true,
      lat: [28, 23, 20],
      latRef: 'S',
      lng: [49, 25, 19],
      lngRef: 'W',
      taken: '2024:03:15 08:42:11',
    })

    const exif = readExif(buffer)

    expect(exif.takenOn).toBe('2024-03-15')
    expect(exif.coordinates?.latitude).toBeCloseTo(-28.3889, 3)
    expect(exif.coordinates?.longitude).toBeCloseTo(-49.4219, 3)
  })

  it('lê a mesma coisa em ordem de bytes pequena (II)', () => {
    const buffer = buildJpegWithExif({
      big: false,
      lat: [28, 23, 20],
      latRef: 'S',
      lng: [49, 25, 19],
      lngRef: 'W',
      taken: '2024:03:15 08:42:11',
    })

    const exif = readExif(buffer)

    expect(exif.takenOn).toBe('2024-03-15')
    expect(exif.coordinates?.latitude).toBeCloseTo(-28.3889, 3)
  })

  it('norte e leste ficam positivos', () => {
    const exif = readExif(
      buildJpegWithExif({
        big: true,
        lat: [10, 0, 0],
        latRef: 'N',
        lng: [20, 0, 0],
        lngRef: 'E',
      }),
    )

    expect(exif.coordinates?.latitude).toBeCloseTo(10, 5)
    expect(exif.coordinates?.longitude).toBeCloseTo(20, 5)
  })

  it('data sem coordenada é válida', () => {
    const exif = readExif(
      buildJpegWithExif({ big: true, taken: '2020:12:31 23:59:59' }),
    )

    expect(exif.takenOn).toBe('2020-12-31')
    expect(exif.coordinates).toBeNull()
  })

  it('JPEG sem EXIF devolve os dois nulos, sem lançar', () => {
    const semExif = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer

    expect(readExif(semExif)).toEqual({ coordinates: null, takenOn: null })
  })

  it('arquivo truncado ou que não é JPEG devolve nulos, sem lançar', () => {
    expect(readExif(new Uint8Array([1, 2, 3]).buffer)).toEqual({
      coordinates: null,
      takenOn: null,
    })
    expect(readExif(new ArrayBuffer(0))).toEqual({
      coordinates: null,
      takenOn: null,
    })
  })
})
