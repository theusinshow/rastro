import { notFound, redirect } from 'next/navigation'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { TripCompletionForm } from '@/components/trips/TripCompletionForm'
import { getTripRepository } from '@/lib/data'

export default async function ConcluirViagemPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const repository = await getTripRepository()
  const trip = await repository.getBySlug(slug)

  if (!trip) notFound()

  // Viagem já concluída não se conclui de novo. A função no banco é idempotente,
  // mas oferecer a tela sugeriria que há algo a fazer aqui.
  if (trip.status === 'completed') redirect(`/viagens/${slug}`)

  return (
    <OverlayPanel side="right">
      <h1 className="sr-only">Concluir {trip.title}</h1>
      <TripCompletionForm trip={trip} />
    </OverlayPanel>
  )
}
