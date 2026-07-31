import type { Coordinates } from './geo'

/**
 * Formatos que o navegador consegue ler EXIF e redimensionar.
 *
 * HEIC fica de fora, e isso é limitação declarada — não esquecimento: o leitor de
 * EXIF entende só JPEG, e o canvas do Chrome não decodifica HEIC. Arquivo fora
 * desta lista é recusado com o motivo na tela, nunca engolido em silêncio.
 */
export const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const MAX_CAPTION_LENGTH = 280

export function isAcceptedImageType(type: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type)
}

export interface Photo {
  id: string
  placeId: string
  /** Nulo é o caso comum: foto anexada a um lugar, fora de qualquer viagem. */
  tripId: string | null
  storagePath: string
  width: number
  height: number
  /** Do EXIF quando houver. Nulo é legítimo, e a interface diz que não sabe. */
  coordinates: Coordinates | null
  /**
   * Data civil `YYYY-MM-DD`, vinda do EXIF. **Nulo significa "não sabemos"**.
   *
   * NÃO cai para o dia do upload: a data em que você mexeu no arquivo não é a
   * data em que a foto foi tirada, e apresentá-la como se fosse seria inventar
   * memória — o mesmo erro que a confirmação de paradas existe para evitar.
   * `created_at` já registra o upload, para quem precisar dele.
   */
  takenOn: string | null
  caption: string | null
  sortIndex: number
}

/** O que o cliente já sabe ao terminar o upload. */
export interface NewPhoto {
  placeId: string
  storagePath: string
  width: number
  height: number
  coordinates: Coordinates | null
  /** Nulo quando a foto não trazia EXIF. */
  takenOn: string | null
  caption: string | null
}

export type PhotoValidationError =
  | 'caption-too-long'
  | 'invalid-dimensions'
  | 'storage-path-required'

export const PHOTO_VALIDATION_MESSAGES: Record<PhotoValidationError, string> = {
  'caption-too-long': `A legenda passa de ${MAX_CAPTION_LENGTH} caracteres.`,
  'invalid-dimensions': 'Não foi possível ler as dimensões da imagem.',
  'storage-path-required': 'A imagem não chegou ao armazenamento.',
}

/**
 * Erros de uma foto informada pelo cliente. Lista vazia significa válida.
 *
 * Acumula em vez de parar no primeiro, como `validateNewPlace` — mesmo motivo.
 */
export function validateNewPhoto(input: NewPhoto): PhotoValidationError[] {
  const errors: PhotoValidationError[] = []

  if (input.caption && input.caption.length > MAX_CAPTION_LENGTH) {
    errors.push('caption-too-long')
  }
  if (
    !Number.isInteger(input.width) ||
    !Number.isInteger(input.height) ||
    input.width <= 0 ||
    input.height <= 0
  ) {
    errors.push('invalid-dimensions')
  }
  if (input.storagePath.trim().length === 0) {
    errors.push('storage-path-required')
  }

  return errors
}
