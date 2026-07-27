import type { Motorcycle } from '@/domain/motorcycle'
import { DEV_USER_ID } from './user'

export const MOCK_MOTORCYCLES: Motorcycle[] = [
  {
    id: 'moto-ibex-450',
    userId: DEV_USER_ID,
    make: 'CFMOTO',
    model: 'IBEX 450',
    year: null,
    nickname: null,
    isDefault: true,
    odometerKm: null,
  },
]
