import { notFound } from 'next/navigation'
import type { PaddingOptions } from 'maplibre-gl'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { TripRouteLayer } from '@/components/map/TripRouteLayer'
import { TripItineraryView } from '@/components/trips/TripItineraryView'
import { getProfileRepository, getTripRepository } from '@/lib/data'

/**
 * Espaço que o cromo desta rota toma do mapa. Números à mão, como em
 * `DiscoveryView`: o MapLibre não lê variável CSS.
 */
const CAMERA_PADDING: PaddingOptions = {
  top: 56 + 24,
  right: 420 + 24,
  bottom: 36 + 24,
  left: 24,
}

export default async function ViagemPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const repository = await getTripRepository()
  const trip = await repository.getBySlug(slug)

  if (!trip) notFound()

  /*
   * A autonomia da moto, para o roteiro poder dizer ONDE abastecer.
   *
   * Nula quando nunca foi informada, e aí o produto **não opina** — a seção de
   * combustível simplesmente não existe, em vez de chutar uma autonomia média e
   * marcar paradas para a moto de outra pessoa. Ver `planRefuelStops`.
   */
  const profile = await (await getProfileRepository()).getProfile()

  return (
    <>
      <h1 className="sr-only">{trip.title}</h1>
      <TripRouteLayer trip={trip} cameraPadding={CAMERA_PADDING} />
      <OverlayPanel side="right">
        <TripItineraryView
          trip={trip}
          autonomyKm={profile?.autonomyKm ?? null}
        />
      </OverlayPanel>
    </>
  )
}
