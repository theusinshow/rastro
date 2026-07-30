import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { TripList } from '@/components/trips/TripList'
import { getTripRepository } from '@/lib/data'

export default async function ViagensPage() {
  const repository = await getTripRepository()
  const trips = await repository.listTrips()

  return (
    <OverlayPanel side="right">
      <h1 className="sr-only">Viagens</h1>
      <TripList trips={trips} />
    </OverlayPanel>
  )
}
