import { toExplorePlace, type ExplorePlace, type PlaceUserState } from '@/domain/place'
import { MOCK_PLACES, MOCK_PLACE_USER_STATES } from '@/mocks/places'
import type { PlaceRepository } from '../place-repository'

/** Estado de quem nunca interagiu com o lugar. */
function neutralState(placeId: string): PlaceUserState {
  return {
    placeId,
    isFavorite: false,
    wantsToVisit: false,
    personalNotes: null,
    rating: null,
    lastVisitedAt: null,
    visitCount: 0,
    photoCount: 0,
  }
}

const stateByPlaceId = new Map(
  MOCK_PLACE_USER_STATES.map((state) => [state.placeId, state]),
)

function buildAll(): ExplorePlace[] {
  return MOCK_PLACES.map((place) =>
    toExplorePlace(place, stateByPlaceId.get(place.id) ?? neutralState(place.id)),
  )
}

export const mockPlaceRepository: PlaceRepository = {
  async listExplorePlaces() {
    return buildAll()
  },

  async getBySlug(slug) {
    return buildAll().find((place) => place.slug === slug) ?? null
  },
}
