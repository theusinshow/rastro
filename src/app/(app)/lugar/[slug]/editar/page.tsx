import { notFound } from 'next/navigation'
import { getPlaceRepository } from '@/lib/data'
import { EditPlaceView } from '@/components/explore/EditPlaceView'

export default async function EditarLugarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const repository = await getPlaceRepository()
  const place = await repository.getBySlug(slug)

  // `isOwn` falso cobre dois casos de uma vez: lugar do catálogo curado e lugar
  // de outro usuário. A RLS já recusaria a escrita; isto evita oferecer uma tela
  // que só falharia no fim.
  if (!place || !place.isOwn) notFound()

  return (
    <>
      <h1 className="sr-only">Editar {place.name}</h1>
      <EditPlaceView place={place} />
    </>
  )
}
