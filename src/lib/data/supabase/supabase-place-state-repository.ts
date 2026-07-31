import type { SupabaseClient } from '@supabase/supabase-js'
import type { AccessSurface } from '@/domain/place'
import type { PlaceStateRepository } from '../place-state-repository'

export function createSupabasePlaceStateRepository(
  supabase: SupabaseClient,
  userId: string,
): PlaceStateRepository {
  /**
   * `upsert` e não `update`: a linha de `place_user_states` só nasce na primeira
   * interação. Um `update` sobre linha inexistente não falharia — não afetaria
   * nenhuma linha e devolveria sucesso, que é o pior resultado possível.
   */
  async function setFlag(
    placeId: string,
    patch: {
      is_favorite?: boolean
      wants_to_visit?: boolean
      access_surface?: AccessSurface | null
    },
  ) {
    const { error } = await supabase.from('place_user_states').upsert(
      {
        user_id: userId,
        place_id: placeId,
        ...patch,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,place_id' },
    )
    if (error) throw new Error(error.message)
  }

  return {
    async setFavorite(placeId, value) {
      await setFlag(placeId, { is_favorite: value })
    },

    async setWantsToVisit(placeId, value) {
      await setFlag(placeId, { wants_to_visit: value })
    },

    async setAccessSurface(placeId, value) {
      await setFlag(placeId, { access_surface: value })
    },

    // Sem `.eq('user_id', userId)` nos três abaixo: a RLS de `place_visits` já
    // restringe a `auth.uid()`. Repetir aqui daria a impressão de que a
    // segurança depende deste arquivo. Ver ADR 0008.
    async recordVisit(placeId, visitedAt) {
      const { error } = await supabase
        .from('place_visits')
        .insert({ user_id: userId, place_id: placeId, visited_at: visitedAt })
      if (error) throw new Error(error.message)
    },

    async updateVisitDate(visitId, visitedAt) {
      const { error } = await supabase
        .from('place_visits')
        .update({ visited_at: visitedAt })
        .eq('id', visitId)
      if (error) throw new Error(error.message)
    },

    async updateVisitReview(visitId, rating, notes) {
      const { error } = await supabase
        .from('place_visits')
        .update({ rating, notes })
        .eq('id', visitId)
      if (error) throw new Error(error.message)
    },

    async removeVisit(visitId) {
      const { error } = await supabase
        .from('place_visits')
        .delete()
        .eq('id', visitId)
      if (error) throw new Error(error.message)
    },
  }
}
