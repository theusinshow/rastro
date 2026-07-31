import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { MemoryTimeline } from '@/components/memories/MemoryTimeline'
import { getMemoryRepository } from '@/lib/data'
import { MEMORY_LIMIT_PER_SOURCE } from '@/lib/data/supabase/supabase-memory-repository'

export default async function MemoriasPage() {
  const repository = await getMemoryRepository()
  const entries = await repository.listEntries()

  // Alguma fonte pode ter batido no teto. Não dá para saber qual sem uma
  // contagem extra, e a resposta honesta ("há mais do que cabe aqui") não
  // precisa disso.
  const truncated = entries.length >= MEMORY_LIMIT_PER_SOURCE

  return (
    <OverlayPanel side="right">
      <h1 className="sr-only">Memórias</h1>
      <MemoryTimeline entries={entries} truncated={truncated} />
    </OverlayPanel>
  )
}
