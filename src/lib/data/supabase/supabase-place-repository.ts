import type { SupabaseClient } from '@supabase/supabase-js'
import type { ExplorePlace } from '@/domain/place'
import type { PlaceRepository } from '../place-repository'
import { PLACE_SELECT, toExplorePlaceFromRow, type PlaceRow } from './place-row'

export function createSupabasePlaceRepository(
  supabase: SupabaseClient,
  userId: string,
): PlaceRepository {
  async function list(): Promise<ExplorePlace[]> {
    const { data, error } = await supabase
      .from('places')
      .select(PLACE_SELECT)
      .order('name')

    if (error) {
      throw new Error(`falha ao ler lugares: ${error.message}`)
    }

    return (data as unknown as PlaceRow[]).map((row) =>
      toExplorePlaceFromRow(row, userId),
    )
  }

  return {
    async listExplorePlaces() {
      return list()
    },

    async getBySlug(slug) {
      const { data, error } = await supabase
        .from('places')
        .select(PLACE_SELECT)
        .eq('slug', slug)
        .maybeSingle()

      if (error) {
        throw new Error(`falha ao ler o lugar ${slug}: ${error.message}`)
      }
      if (!data) return null

      return toExplorePlaceFromRow(data as unknown as PlaceRow, userId)
    },
  }
}
