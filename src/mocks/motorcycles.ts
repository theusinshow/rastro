import type { Motorcycle } from '@/domain/motorcycle'

/**
 * FIXTURE DE TESTE. As motos reais vivem em `motorcycles` no Supabase, ligadas
 * ao usuário autenticado — este arquivo não é lido pela aplicação.
 */
export const MOCK_MOTORCYCLES: Motorcycle[] = [
  {
    id: 'moto-ibex-450',
    userId: 'fixture-user',
    make: 'CFMOTO',
    model: 'IBEX 450',
    year: null,
    nickname: null,
    isDefault: true,
    odometerKm: null,
  },
]
