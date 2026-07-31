/**
 * `{userId}/{placeId}/{uuid}.jpg`.
 *
 * O usuário PRECISA ser o primeiro segmento: a política de RLS do Storage
 * compara `(storage.foldername(name))[1]` com `auth.uid()`. Mudar a ordem
 * quebraria a autorização sem nenhum erro aparecer — a escrita passaria a ser
 * recusada, ou pior, aceita onde não devia.
 *
 * A extensão é sempre `.jpg` porque o canvas reencoda tudo para JPEG.
 */
export function buildStoragePath(
  userId: string,
  placeId: string,
  uuid: string,
): string {
  return `${userId}/${placeId}/${uuid}.jpg`
}
