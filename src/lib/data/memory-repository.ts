import type { MemoryEntry } from '@/domain/memory'

/**
 * Leitura de tudo que virou memória: visitas, viagens concluídas e fotografias.
 *
 * Não recebe `userId`: as três tabelas têm política própria filtrando por
 * `auth.uid()`. Ver ADR 0008.
 */
export interface MemoryRepository {
  listEntries(): Promise<MemoryEntry[]>
}
