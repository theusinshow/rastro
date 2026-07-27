import { placeRepository } from '@/lib/data'
import { ExploreView } from '@/components/explore/ExploreView'

export default async function ExplorePage() {
  const places = await placeRepository.listExplorePlaces()
  return <ExploreView places={places} />
}
