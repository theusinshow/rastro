import { getPlaceRepository } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { DataFallback } from '@/components/layout/DataFallback'
import { ExploreView } from '@/components/explore/ExploreView'

export default async function ExplorePage() {
  if (!isSupabaseConfigured()) return <DataFallback />
  const repository = await getPlaceRepository()
  const places = await repository.listExplorePlaces()
  return <ExploreView places={places} />
}
