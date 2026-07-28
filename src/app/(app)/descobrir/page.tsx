import { getPlaceRepository } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { DataFallback } from '@/components/layout/DataFallback'
import { DiscoveryView } from '@/components/explore/DiscoveryView'

export default async function DescobrirPage() {
  if (!isSupabaseConfigured()) return <DataFallback />
  const repository = await getPlaceRepository()
  const places = await repository.listExplorePlaces()
  return <DiscoveryView places={places} />
}
