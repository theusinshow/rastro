import type { SupabaseClient } from '@supabase/supabase-js'
import type { NewPlace } from '@/domain/place'
import type { PlaceCatalogRepository } from '../place-catalog-repository'
import { PLACE_SELECT, toExplorePlaceFromRow, type PlaceRow } from './place-row'

function toColumns(input: NewPlace) {
  return {
    name: input.name.trim(),
    description: input.description.trim() || null,
    latitude: input.latitude,
    longitude: input.longitude,
    municipality: input.municipality.trim() || null,
    category: input.category,
    tags: input.tags,
  }
}

export function createSupabasePlaceCatalogRepository(
  supabase: SupabaseClient,
  userId: string,
): PlaceCatalogRepository {
  return {
    async listSlugs() {
      const { data, error } = await supabase.from('places').select('slug')
      if (error) throw new Error(error.message)
      return (data as { slug: string }[]).map((row) => row.slug)
    },

    async createPlace(input, slug) {
      const { data, error } = await supabase
        .from('places')
        .insert({
          ...toColumns(input),
          slug,
          state_code: 'SC',
          source: 'manual',
          created_by: userId,
          // O default do schema é `true`, herdado do catálogo curado. Lugar de
          // usuário é privado: "rede social" está fora de escopo declarado.
          is_public: false,
        })
        .select(PLACE_SELECT)
        .single()

      if (error) throw new Error(error.message)
      return toExplorePlaceFromRow(data as unknown as PlaceRow, userId)
    },

    /**
     * O slug NÃO muda ao editar o nome. Mudar quebraria qualquer URL
     * compartilhada daquele lugar, e o ADR 0006 apoia a aplicação inteira em
     * URLs reproduzíveis.
     */
    async updatePlace(id, input) {
      const { data, error } = await supabase
        .from('places')
        .update({ ...toColumns(input), updated_at: new Date().toISOString() })
        .eq('id', id)
        .select(PLACE_SELECT)
        .single()

      if (error) throw new Error(error.message)
      return toExplorePlaceFromRow(data as unknown as PlaceRow, userId)
    },

    async deletePlace(id) {
      const { error } = await supabase.from('places').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
  }
}
