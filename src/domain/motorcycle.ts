export interface Motorcycle {
  id: string
  userId: string
  make: string
  model: string
  year: number | null
  nickname: string | null
  isDefault: boolean
  odometerKm: number | null
}

/** `'CFMOTO IBEX 450'` — usado em cabeçalhos de viagem e memórias. */
export function motorcycleLabel(motorcycle: Motorcycle): string {
  return `${motorcycle.make} ${motorcycle.model}`
}
