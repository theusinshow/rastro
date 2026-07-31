import type { SupabaseClient } from '@supabase/supabase-js'
import type { PhotoRepository } from '../photo-repository'
import { PHOTO_SELECT, toPhotoFromRow, type PhotoRow } from './photo-row'

export const PHOTO_BUCKET = 'fotos'

/** Uma hora é bem mais que o tempo de olhar um painel, e expira no mesmo dia. */
const SIGNED_URL_TTL_SECONDS = 3600

export function createSupabasePhotoRepository(
  supabase: SupabaseClient,
  userId: string,
): PhotoRepository {
  return {
    async listByPlace(placeId) {
      const { data, error } = await supabase
        .from('photos')
        .select(PHOTO_SELECT)
        .eq('place_id', placeId)
        // Mais recente primeiro, com data desconhecida por último: foto sem data
        // não é foto de hoje, e não deve encabeçar a galeria.
        .order('taken_on', { ascending: false, nullsFirst: false })
        .order('sort_index', { ascending: true })

      if (error) throw new Error(error.message)
      const rows = data as unknown as PhotoRow[]
      if (rows.length === 0) return []

      // UMA chamada para a galeria inteira. Assinar uma por foto multiplicaria
      // ida e volta por nada.
      const { data: signed, error: signError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .createSignedUrls(
          rows.map((row) => row.storage_path),
          SIGNED_URL_TTL_SECONDS,
        )

      if (signError) throw new Error(signError.message)

      const urlByPath = new Map(
        (signed ?? [])
          .filter((item) => item.signedUrl && item.path)
          .map((item) => [item.path as string, item.signedUrl]),
      )

      return (
        rows
          .map((row) => ({
            ...toPhotoFromRow(row),
            url: urlByPath.get(row.storage_path) ?? '',
          }))
          // Sem URL a imagem não desenha; melhor omitir que mostrar quadro
          // quebrado.
          .filter((photo) => photo.url !== '')
      )
    },

    async addPhoto(input) {
      // `sort_index` é a ordem de upload dentro do lugar. Lido antes da
      // inserção; a corrida entre os dois é conhecida e aceita, como no slug de
      // lugares: um único usuário não sobe duas fotos no mesmo instante.
      const { data: last } = await supabase
        .from('photos')
        .select('sort_index')
        .eq('place_id', input.placeId)
        .order('sort_index', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextIndex =
        ((last as { sort_index: number } | null)?.sort_index ?? -1) + 1

      const { data, error } = await supabase
        .from('photos')
        .insert({
          // `userId` aqui é VALOR GRAVADO, não filtro. A RLS continua sendo
          // quem decide quem lê o quê — ver ADR 0008.
          user_id: userId,
          place_id: input.placeId,
          trip_id: null,
          storage_path: input.storagePath,
          width: input.width,
          height: input.height,
          latitude: input.coordinates?.latitude ?? null,
          longitude: input.coordinates?.longitude ?? null,
          taken_on: input.takenOn,
          caption: input.caption?.trim() || null,
          sort_index: nextIndex,
        })
        .select(PHOTO_SELECT)
        .single()

      if (error) throw new Error(error.message)
      return toPhotoFromRow(data as unknown as PhotoRow)
    },

    async deletePhoto(id) {
      // Apaga a LINHA primeiro: arquivo órfão é desperdício, mas linha apontando
      // para arquivo inexistente é foto quebrada na tela.
      const { data, error } = await supabase
        .from('photos')
        .delete()
        .eq('id', id)
        .select('storage_path')
        .single()

      if (error) throw new Error(error.message)
      return { storagePath: (data as { storage_path: string }).storage_path }
    },
  }
}
