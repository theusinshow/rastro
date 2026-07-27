import { placeRepository } from '@/lib/data'
import { DiscoveryView } from '@/components/explore/DiscoveryView'

export default async function DescobrirPage() {
  const places = await placeRepository.listExplorePlaces()
  return <DiscoveryView places={places} />
}
