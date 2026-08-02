import { getPlaceRepository } from '@/lib/data'
import { loadCarouselCards } from '@/lib/photos'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { DataFallback } from '@/components/layout/DataFallback'
import { ExploreView } from '@/components/explore/ExploreView'

export default async function ExplorePage() {
  if (!isSupabaseConfigured()) return <DataFallback />
  const repository = await getPlaceRepository()
  const places = await repository.listExplorePlaces()

  // **Sem `await`, de propósito.** A promessa atravessa para o cliente e é
  // desembrulhada lá dentro de um `Suspense`: o mapa e a pergunta pintam na
  // hora, e a vitrine entra quando o Commons responder. Aguardar aqui deixaria
  // uma API de terceiro decidir quando a tela inicial aparece.
  const cardsPromise = loadCarouselCards(places)

  return <ExploreView places={places} cardsPromise={cardsPromise} />
}
