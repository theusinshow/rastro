import {
  carouselPlaces,
  toCarouselCard,
  type CarouselCard,
} from '@/domain/carousel'
import type { ExplorePlace } from '@/domain/place'
// De `./commons`, e não do `./index` que reexporta este arquivo: o barril
// importando quem o importa é um ciclo, e ciclo em ESM resolve como `undefined`
// em tempo de carga sem avisar ninguém.
import { createCommonsClient } from './commons'

/**
 * Os cartões da vitrine, prontos para o cliente.
 *
 * Roda no SERVIDOR, e é o ponto do desenho que evita a cascata: sem isto cada
 * cartão pediria a sua foto do navegador, e a vitrine apareceria em pedaços —
 * com cartões nascendo e sumindo conforme cada resposta chegasse.
 *
 * Quem tem capa curada não vai ao Commons: é ida de rede por nada.
 *
 * `Promise.all` e não sequência. O cliente do Commons nunca lança — falha vira
 * lista vazia, e lista vazia vira lugar fora do carrossel —, então não há
 * rejeição de uma ida para derrubar as outras.
 */
export async function loadCarouselCards(
  places: ExplorePlace[],
): Promise<CarouselCard[]> {
  const commons = createCommonsClient()

  const cards = await Promise.all(
    carouselPlaces(places).map(async (place) => {
      if (place.coverImageUrl) return toCarouselCard(place, [])
      const photos = await commons.forPlace(place, place.name)
      return toCarouselCard(place, photos)
    }),
  )

  return cards.filter((card): card is CarouselCard => card !== null)
}
