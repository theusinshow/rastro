import type { NewPhoto, Photo } from '@/domain/photo'

/** Foto com a URL assinada pronta para o `<img>`. */
export interface PhotoWithUrl extends Photo {
  url: string
}

/**
 * Contrato de fotografias.
 *
 * Nenhum método recebe `userId` para filtrar: a política `photos_own` filtra por
 * `auth.uid()`. Ver ADR 0008.
 */
export interface PhotoRepository {
  listByPlace(placeId: string): Promise<PhotoWithUrl[]>
  addPhoto(input: NewPhoto): Promise<Photo>
  /**
   * Apaga a linha e devolve o caminho, para o chamador remover o objeto.
   *
   * A linha sai primeiro de propósito: arquivo órfão é desperdício, mas linha
   * apontando para arquivo inexistente é foto quebrada na tela.
   */
  deletePhoto(id: string): Promise<{ storagePath: string }>
}
