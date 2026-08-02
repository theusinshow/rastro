import type { ExplorePlace, PlaceCategory } from './place'

/**
 * O mínimo que o domínio precisa saber de uma foto de terceiro.
 *
 * **Não importa `CommonsPhoto`**, e isso é regra de camada, não preferência:
 * `src/domain/` não conhece `src/lib/`. `CommonsPhoto` satisfaz esta forma por
 * estrutura, e o dia em que outra fonte de foto entrar ela satisfaz também.
 */
export interface CandidatePhoto {
  thumbnailUrl: string
  /** Metros até o lugar. `null` significa que a foto não tem coordenada. */
  distanceM: number | null
}

/**
 * De onde veio a imagem do cartão. Muda o que o produto pode afirmar sobre ela.
 *
 * - `capa` — curada por nós. É do lugar, e não precisa de etiqueta.
 * - `commons` — de terceiro, com GPS dentro do raio. A distância é fato.
 */
export type CardImageSource = 'capa' | 'commons'

export interface CardImage {
  url: string
  source: CardImageSource
  /** Metros entre a foto e o lugar. Sempre `null` quando a fonte é `capa`. */
  distanceM: number | null
}

/** O que o cartão precisa para se desenhar. Nada além disso. */
export interface CarouselCard {
  slug: string
  name: string
  category: PlaceCategory
  latitude: number
  longitude: number
  image: CardImage
}

/**
 * O que ainda falta conhecer, na ordem recebida.
 *
 * A ordem é a do passeio de câmera, e preservá-la é o que impede mapa e vitrine
 * de discordarem sobre qual lugar está em foco.
 *
 * `quero-conhecer` entra junto com `nao-visitado` de propósito: os dois são
 * lugares onde a pessoa não esteve, e a vitrine responde "para onde eu vou?",
 * não "o que eu marquei?".
 */
export function carouselPlaces(places: ExplorePlace[]): ExplorePlace[] {
  return places.filter((place) => place.visitStatus !== 'visitado')
}

/**
 * A imagem do cartão, em escada. O primeiro degrau que responder vence.
 *
 * **Foto casada pelo nome é recusada**, e é a decisão mais importante daqui.
 * Num painel ela é tolerável porque a etiqueta declara a procedência e a pessoa
 * julga — `PlaceNearbyPhotos` documenta que procurar "Santo Amaro da
 * Imperatriz" devolve o hospital do município junto. Num carrossel de vitrine a
 * foto é o argumento inteiro, e ilustrar a serra com o hospital é afirmar o que
 * não sabemos.
 *
 * O preço está aceito: com as capas em branco, o carrossel nasce curto.
 */
export function resolveCardImage(
  place: Pick<ExplorePlace, 'coverImageUrl'>,
  photos: CandidatePhoto[],
): CardImage | null {
  if (place.coverImageUrl) {
    return { url: place.coverImageUrl, source: 'capa', distanceM: null }
  }

  for (const photo of photos) {
    // O `continue` estreita `distanceM` para `number` no retorno. Um `.find()`
    // com predicado não estreita, e obrigaria a uma asserção.
    if (photo.distanceM === null) continue
    return {
      url: photo.thumbnailUrl,
      source: 'commons',
      distanceM: photo.distanceM,
    }
  }

  return null
}

/** `null` quando não há imagem: lugar sem foto não vira cartão de vitrine. */
export function toCarouselCard(
  place: ExplorePlace,
  photos: CandidatePhoto[],
): CarouselCard | null {
  const image = resolveCardImage(place, photos)
  if (!image) return null

  return {
    slug: place.slug,
    name: place.name,
    category: place.category,
    latitude: place.latitude,
    longitude: place.longitude,
    image,
  }
}
