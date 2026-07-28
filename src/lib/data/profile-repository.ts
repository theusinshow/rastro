import type { Coordinates } from '@/domain/geo'
import type { Profile } from '@/domain/profile'

export interface ProfileRepository {
  getProfile(): Promise<Profile | null>
  setHome(home: Coordinates, label: string): Promise<void>
}
