import { mockPlaceRepository } from './mock/mock-place-repository'
import type { PlaceRepository } from './place-repository'

/**
 * Adapter ativo. Este é o único arquivo que muda quando o Supabase entrar.
 * Nenhum componente importa um adapter concreto diretamente.
 */
export const placeRepository: PlaceRepository = mockPlaceRepository

export type { PlaceRepository }
