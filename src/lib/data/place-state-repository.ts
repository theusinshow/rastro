/**
 * Escrita do vínculo entre o usuário e um lugar.
 *
 * Separado de `PlaceCatalogRepository` de propósito: é a mesma divisa que o
 * ADR 0003 traçou entre fato objetivo e opinião. Favorito e visita são meus;
 * o lugar não é necessariamente.
 *
 * `recordVisit` acumula em vez de alternar: `visitado` não é uma chave, é
 * consequência de existir linha em `place_visits`. Um `setVisited(false)` só
 * poderia ser implementado apagando memória.
 */
export interface PlaceStateRepository {
  setFavorite(placeId: string, value: boolean): Promise<void>
  setWantsToVisit(placeId: string, value: boolean): Promise<void>
  recordVisit(placeId: string, visitedAt: string): Promise<void>
  updateVisitDate(visitId: string, visitedAt: string): Promise<void>
  /**
   * Como foi ESTA passagem. Distinto da opinião geral sobre o lugar, que vive em
   * `place_user_states.rating` — a serra pode ser 5 e o dia em que você a pegou
   * fechada de neblina, 2.
   */
  updateVisitReview(
    visitId: string,
    rating: number | null,
    notes: string | null,
  ): Promise<void>
  removeVisit(visitId: string): Promise<void>
}
