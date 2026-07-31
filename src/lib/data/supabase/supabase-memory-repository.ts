import type { SupabaseClient } from '@supabase/supabase-js'
import type { MemoryEntry } from '@/domain/memory'
import type { MemoryRepository } from '../memory-repository'
import { PHOTO_BUCKET } from './supabase-photo-repository'

/** Uma hora basta para olhar uma linha do tempo, e expira no mesmo dia. */
const SIGNED_URL_TTL_SECONDS = 3600

/**
 * Teto por fonte.
 *
 * Existe para que a tela não cresça sem limite, e é DECLARADO na interface
 * quando corta — uma lista silenciosamente truncada se lê como "foi só isso que
 * aconteceu", que é o pior erro possível numa tela de memória.
 */
export const MEMORY_LIMIT_PER_SOURCE = 100

interface VisitRow {
  id: string
  visited_at: string
  notes: string | null
  places: { name: string; slug: string; municipality: string | null } | null
}

interface TripRow {
  id: string
  slug: string
  title: string
  ended_at: string | null
  distance_km: number | null
}

interface PhotoRow {
  id: string
  storage_path: string
  taken_on: string | null
  caption: string | null
  places: { name: string; slug: string } | null
}

export function createSupabaseMemoryRepository(
  supabase: SupabaseClient,
): MemoryRepository {
  return {
    async listEntries() {
      const [visitas, viagens, fotos] = await Promise.all([
        supabase
          .from('place_visits')
          .select('id, visited_at, notes, places (name, slug, municipality)')
          .order('visited_at', { ascending: false })
          .limit(MEMORY_LIMIT_PER_SOURCE),
        supabase
          .from('trips')
          .select('id, slug, title, ended_at, distance_km')
          .eq('status', 'completed')
          .order('ended_at', { ascending: false })
          .limit(MEMORY_LIMIT_PER_SOURCE),
        supabase
          .from('photos')
          .select('id, storage_path, taken_on, caption, places (name, slug)')
          .order('taken_on', { ascending: false, nullsFirst: false })
          .limit(MEMORY_LIMIT_PER_SOURCE),
      ])

      const entries: MemoryEntry[] = []

      for (const row of (visitas.data ?? []) as unknown as VisitRow[]) {
        if (!row.places) continue
        entries.push({
          id: `visita-${row.id}`,
          kind: 'visit',
          on: row.visited_at,
          title: row.places.name,
          subtitle: row.notes ?? row.places.municipality,
          href: `/?lugar=${row.places.slug}`,
        })
      }

      for (const row of (viagens.data ?? []) as unknown as TripRow[]) {
        entries.push({
          id: `viagem-${row.id}`,
          kind: 'trip',
          // `ended_at` é `timestamptz`; a linha do tempo agrupa por data civil.
          on: row.ended_at ? row.ended_at.slice(0, 10) : null,
          title: row.title,
          subtitle:
            row.distance_km !== null ? `${Math.round(row.distance_km)} km` : null,
          href: `/viagens/${row.slug}`,
        })
      }

      const fotoRows = ((fotos.data ?? []) as unknown as PhotoRow[]).filter(
        (row) => row.places !== null,
      )

      // Uma assinatura para todas as fotos, não uma por foto.
      const assinadas =
        fotoRows.length > 0
          ? await supabase.storage
              .from(PHOTO_BUCKET)
              .createSignedUrls(
                fotoRows.map((row) => row.storage_path),
                SIGNED_URL_TTL_SECONDS,
              )
          : { data: [] }

      const urlPorCaminho = new Map(
        (assinadas.data ?? [])
          .filter((item) => item.signedUrl && item.path)
          .map((item) => [item.path as string, item.signedUrl]),
      )

      for (const row of fotoRows) {
        const url = urlPorCaminho.get(row.storage_path)
        // Sem URL a imagem não desenha; melhor omitir que mostrar moldura vazia.
        if (!url) continue
        entries.push({
          id: `foto-${row.id}`,
          kind: 'photo',
          on: row.taken_on,
          title: row.places?.name ?? '',
          subtitle: row.caption,
          href: `/?lugar=${row.places?.slug ?? ''}`,
          imageUrl: url,
        })
      }

      return entries
    },
  }
}
