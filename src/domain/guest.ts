/**
 * Quem está olhando.
 *
 * `isGuest` é o visitante sem conta — a sessão anônima do Supabase, que tem
 * `auth.uid()` como qualquer outra e por isso atravessa middleware, repositórios
 * e RLS sem tratamento especial. Ver ADR 0017.
 *
 * Não confundir com o "anônimo" de `docs/VERIFICACAO-RLS.md`: lá a palavra
 * significa requisição SEM sessão nenhuma, que é o oposto disto.
 */
export interface Viewer {
  isGuest: boolean
}

/**
 * Fotografia é a única escrita que deixa arquivo permanente e custo, e por isso
 * a única fechada ao visitante.
 *
 * **Esta função não é a tranca, é a placa na porta.** Quem recusa de verdade são
 * as políticas restritivas da migration 0008 — aqui só evitamos oferecer o que o
 * banco vai negar. Se as duas divergirem, quem manda é a política.
 */
export function canUploadPhotos(viewer: Viewer): boolean {
  return !viewer.isGuest
}
