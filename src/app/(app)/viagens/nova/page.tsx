import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { TripProposalForm } from '@/components/trips/TripProposalForm'
import { getPlaceRepository } from '@/lib/data'

export default async function NovaViagemPage({
  searchParams,
}: {
  searchParams: Promise<{ paradas?: string }>
}) {
  const { paradas } = await searchParams

  // O catálogo é lido aqui, no servidor, e não no cliente: o formulário só
  // precisa de nome e id para o seletor de destino.
  const repository = await getPlaceRepository()
  const places = (await repository.listExplorePlaces()).map((place) => ({
    id: place.id,
    name: place.name,
  }))

  const known = new Set(places.map((place) => place.id))
  // Filtra contra o catálogo: id vindo da URL é entrada de fora, e um id
  // inventado renderizaria uma parada fantasma no formulário.
  const initialPlaceIds = (paradas?.split(',') ?? [])
    .map((id) => id.trim())
    .filter((id) => known.has(id))

  return (
    <OverlayPanel side="right">
      <h1 className="sr-only">Montar um roteiro</h1>
      <TripProposalForm places={places} initialPlaceIds={initialPlaceIds} />
    </OverlayPanel>
  )
}
