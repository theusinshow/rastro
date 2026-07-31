import type { Coordinates } from '@/domain/geo'
import type { Profile } from '@/domain/profile'

export interface ProfileRepository {
  getProfile(): Promise<Profile | null>
  setHome(home: Coordinates, label: string): Promise<void>
  /** `null` limpa a autonomia e volta o produto a não opinar sobre combustível. */
  setAutonomy(autonomyKm: number | null): Promise<void>
}
