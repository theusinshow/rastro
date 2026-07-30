import type { SupabaseClient } from '@supabase/supabase-js'
import type { NewTripInput, TripRepository } from '../trip-repository'
import {
  TRIP_SELECT,
  toTripDetailFromRow,
  toTripSummaryFromRow,
  type TripRow,
} from './trip-row'

function toTripColumns(input: NewTripInput, slug: string, userId: string) {
  return {
    // `userId` aqui é VALOR GRAVADO, não filtro. A RLS continua sendo quem
    // decide quem lê o quê — ver ADR 0008.
    user_id: userId,
    title: input.title.trim(),
    slug,
    status: 'planned' as const,
    origin_label: input.originLabel?.trim() || null,
    origin_latitude: input.originCoordinates.latitude,
    origin_longitude: input.originCoordinates.longitude,
    distance_km: input.distanceKm,
    duration_minutes: Math.round(input.durationMinutes),
    route_geojson: input.routeGeoJson,
  }
}

export function createSupabaseTripRepository(
  supabase: SupabaseClient,
  userId: string,
): TripRepository {
  return {
    async listTrips() {
      const { data, error } = await supabase
        .from('trips')
        .select(TRIP_SELECT)
        .order('started_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return (data as unknown as TripRow[]).map(toTripSummaryFromRow)
    },

    async getBySlug(slug) {
      const { data, error } = await supabase
        .from('trips')
        .select(TRIP_SELECT)
        .eq('slug', slug)
        .maybeSingle()

      if (error) throw new Error(error.message)
      if (!data) return null
      return toTripDetailFromRow(data as unknown as TripRow)
    },

    async listSlugs() {
      const { data, error } = await supabase.from('trips').select('slug')
      if (error) throw new Error(error.message)
      return (data as { slug: string }[]).map((row) => row.slug)
    },

    async createTrip(input, slug) {
      const { data: trip, error } = await supabase
        .from('trips')
        .insert(toTripColumns(input, slug, userId))
        .select('id')
        .single()

      if (error) throw new Error(error.message)
      const tripId = (trip as { id: string }).id

      if (input.stops.length > 0) {
        const { error: stopsError } = await supabase.from('trip_stops').insert(
          input.stops.map((stop, index) => ({
            trip_id: tripId,
            place_id: stop.placeId,
            order_index: index,
            label: stop.label,
            latitude: stop.coordinates.latitude,
            longitude: stop.coordinates.longitude,
            kind: stop.kind,
          })),
        )

        // Viagem sem parada é inútil. Apagar o cabeçalho é preferível a deixar
        // uma viagem vazia no histórico de quem não pediu isso.
        if (stopsError) {
          await supabase.from('trips').delete().eq('id', tripId)
          throw new Error(stopsError.message)
        }
      }

      const { data, error: readError } = await supabase
        .from('trips')
        .select(TRIP_SELECT)
        .eq('id', tripId)
        .single()

      if (readError) throw new Error(readError.message)
      return toTripDetailFromRow(data as unknown as TripRow)
    },

    async deleteTrip(id) {
      const { error } = await supabase.from('trips').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },

    /**
     * Uma chamada, uma transação. Escrever `trips` e `place_visits` em dois
     * `await` deixaria o banco mentindo de forma VISÍVEL na falha do meio: é o
     * registro de visita que pinta o pin de verde no mapa.
     */
    async completeTrip(tripId, confirmedStopIds, visitedAt) {
      const { error } = await supabase.rpc('complete_trip', {
        p_trip_id: tripId,
        p_confirmed_stop_ids: confirmedStopIds,
        p_visited_at: visitedAt,
      })

      if (error) throw new Error(error.message)
    },
  }
}
