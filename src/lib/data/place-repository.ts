import type { ExplorePlace } from '@/domain/place'

/**
 * Contrato de leitura de lugares.
 *
 * A interface fala em `ExplorePlace` — catálogo já combinado com estado pessoal.
 * Combinar é responsabilidade do adapter, porque no Supabase isso será um JOIN e
 * não faz sentido vazar essa forma para a UI.
 */
export interface PlaceRepository {
  listExplorePlaces(): Promise<ExplorePlace[]>
  getBySlug(slug: string): Promise<ExplorePlace | null>
}
