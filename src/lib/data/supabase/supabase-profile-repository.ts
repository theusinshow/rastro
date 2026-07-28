import type { SupabaseClient } from '@supabase/supabase-js'
import type { Coordinates } from '@/domain/geo'
import type { ProfileRepository } from '../profile-repository'

interface ProfileRow {
  id: string
  display_name: string | null
  home_label: string | null
  home_latitude: number | null
  home_longitude: number | null
}

export function createSupabaseProfileRepository(
  supabase: SupabaseClient,
  userId: string,
): ProfileRepository {
  return {
    async getProfile() {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, home_label, home_latitude, home_longitude')
        .eq('id', userId)
        .maybeSingle<ProfileRow>()

      if (error) throw new Error(`falha ao ler o perfil: ${error.message}`)
      if (!data) return null

      // As duas coordenadas andam juntas: meia origem não é origem.
      const home =
        data.home_latitude !== null && data.home_longitude !== null
          ? { latitude: data.home_latitude, longitude: data.home_longitude }
          : null

      return {
        id: data.id,
        displayName: data.display_name,
        home,
        homeLabel: data.home_label,
      }
    },

    async setHome(home: Coordinates, label: string) {
      const { error } = await supabase
        .from('profiles')
        .update({
          home_latitude: home.latitude,
          home_longitude: home.longitude,
          home_label: label,
        })
        .eq('id', userId)

      if (error) throw new Error(`falha ao gravar a origem: ${error.message}`)
    },
  }
}
