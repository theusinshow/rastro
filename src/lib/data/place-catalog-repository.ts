import type { ExplorePlace, NewPlace } from '@/domain/place'

/**
 * Escrita do catálogo — fato objetivo sobre um lugar.
 *
 * Separado de `PlaceStateRepository` porque é a divisa do ADR 0003: o lugar é
 * fato, favorito e visita são opinião. Um usuário pode ter opinião sobre um
 * lugar que não criou.
 *
 * `slug` é argumento de `createPlace`, e não derivado lá dentro, porque a
 * unicidade depende do que já existe — e essa consulta pertence à ação, que já
 * fala com o banco, não ao adapter que só executa.
 */
export interface PlaceCatalogRepository {
  listSlugs(): Promise<string[]>
  createPlace(input: NewPlace, slug: string): Promise<ExplorePlace>
  updatePlace(id: string, input: NewPlace): Promise<ExplorePlace>
  deletePlace(id: string): Promise<void>
}
