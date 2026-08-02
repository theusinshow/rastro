import { describe, expect, it } from 'vitest'
import {
  carouselPlaces,
  resolveCardImage,
  toCarouselCard,
  type CandidatePhoto,
} from './carousel'
import type { ExplorePlace } from './place'

function place(overrides: Partial<ExplorePlace> = {}): ExplorePlace {
  return {
    id: 'id-1',
    slug: 'serra-do-rio-do-rastro',
    name: 'Serra do Rio do Rastro',
    description: '',
    latitude: -28.38,
    longitude: -49.53,
    municipality: 'Bom Jardim da Serra',
    stateCode: 'SC',
    category: 'serra',
    tags: [],
    coverImageUrl: null,
    source: 'mock',
    visitStatus: 'nao-visitado',
    isFavorite: false,
    photoCount: 0,
    lastVisitedAt: null,
    visits: [],
    isOwn: false,
    accessSurface: null,
    ...overrides,
  }
}

const COM_GPS: CandidatePhoto = {
  thumbnailUrl: 'https://commons/serra.jpg',
  distanceM: 680,
}

const SEM_GPS: CandidatePhoto = {
  thumbnailUrl: 'https://commons/hospital.jpg',
  distanceM: null,
}

describe('carouselPlaces', () => {
  it('deixa de fora o que já foi visitado', () => {
    const places = [
      place({ slug: 'a', visitStatus: 'nao-visitado' }),
      place({ slug: 'b', visitStatus: 'visitado' }),
      place({ slug: 'c', visitStatus: 'quero-conhecer' }),
    ]

    expect(carouselPlaces(places).map((item) => item.slug)).toEqual(['a', 'c'])
  })

  it('preserva a ordem recebida, que é a ordem do passeio', () => {
    const places = [
      place({ slug: 'c' }),
      place({ slug: 'a' }),
      place({ slug: 'b' }),
    ]

    expect(carouselPlaces(places).map((item) => item.slug)).toEqual([
      'c',
      'a',
      'b',
    ])
  })

  it('devolve tudo quando ninguém visitou nada', () => {
    const places = [place({ slug: 'a' }), place({ slug: 'b' })]

    expect(carouselPlaces(places)).toHaveLength(2)
  })
})

describe('resolveCardImage', () => {
  it('a capa curada vence qualquer foto de terceiro', () => {
    const image = resolveCardImage(
      place({ coverImageUrl: 'https://rastro/capa.jpg' }),
      [COM_GPS],
    )

    expect(image).toEqual({
      url: 'https://rastro/capa.jpg',
      source: 'capa',
      distanceM: null,
    })
  })

  it('sem capa, aceita a foto do Commons que tem coordenada', () => {
    const image = resolveCardImage(place(), [SEM_GPS, COM_GPS])

    expect(image).toEqual({
      url: 'https://commons/serra.jpg',
      source: 'commons',
      distanceM: 680,
    })
  })

  it('recusa foto casada pelo nome: pode ser de outro ponto do município', () => {
    expect(resolveCardImage(place(), [SEM_GPS])).toBeNull()
  })

  it('sem foto nenhuma, não inventa imagem', () => {
    expect(resolveCardImage(place(), [])).toBeNull()
  })
})

describe('toCarouselCard', () => {
  it('carrega o que o cartão precisa para se desenhar', () => {
    const card = toCarouselCard(place(), [COM_GPS])

    expect(card).toEqual({
      slug: 'serra-do-rio-do-rastro',
      name: 'Serra do Rio do Rastro',
      category: 'serra',
      latitude: -28.38,
      longitude: -49.53,
      image: {
        url: 'https://commons/serra.jpg',
        source: 'commons',
        distanceM: 680,
      },
    })
  })

  it('lugar sem imagem não vira cartão', () => {
    expect(toCarouselCard(place(), [])).toBeNull()
  })
})
