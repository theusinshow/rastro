/**
 * A linha do tempo de Memórias.
 *
 * Três coisas viram memória, e todas têm data: uma visita registrada, uma viagem
 * concluída e uma fotografia. Aqui elas são um tipo só, porque a pergunta que a
 * tela responde — *"o que ficou daquele mês?"* — não distingue a origem.
 */
export type MemoryKind = 'visit' | 'trip' | 'photo'

export interface MemoryEntry {
  id: string
  kind: MemoryKind
  /** Data civil `YYYY-MM-DD`. **Nulo é legítimo**: foto sem EXIF não tem data. */
  on: string | null
  title: string
  subtitle: string | null
  /** Para onde a entrada leva ao ser tocada. */
  href: string
  /** URL assinada, só quando `kind` é `'photo'`. */
  imageUrl?: string
}

export interface MemoryMonth {
  /** `'2026-03'`, ou `null` para o grupo do que não tem data. */
  month: string | null
  entries: MemoryEntry[]
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
] as const

/** `'2026-03'` → `'março de 2026'`. */
export function monthLabel(month: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  if (!match) return month

  const nome = MESES[Number(match[2]) - 1]
  if (!nome) return month

  return `${nome} de ${match[1]}`
}

/**
 * Agrupa por mês, do mais recente ao mais antigo.
 *
 * Mês sem nada **não aparece**: não ter andado de moto em abril não é um fato a
 * exibir, e uma fileira de meses vazios transformaria a memória num calendário
 * de ausências.
 *
 * O que não tem data vai para um grupo próprio, no fim — nunca jogado no mês de
 * hoje. A data em que você subiu um arquivo não é a data em que aquilo
 * aconteceu, e essa é a mesma regra que faz `takenOn` aceitar nulo.
 */
export function groupByMonth(entries: readonly MemoryEntry[]): MemoryMonth[] {
  const porMes = new Map<string, MemoryEntry[]>()
  const semData: MemoryEntry[] = []

  for (const entry of entries) {
    if (!entry.on) {
      semData.push(entry)
      continue
    }
    const month = entry.on.slice(0, 7)
    const atual = porMes.get(month)
    if (atual) atual.push(entry)
    else porMes.set(month, [entry])
  }

  const grupos: MemoryMonth[] = [...porMes.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([month, lista]) => ({
      month,
      entries: [...lista].sort((a, b) => (b.on ?? '').localeCompare(a.on ?? '')),
    }))

  if (semData.length > 0) grupos.push({ month: null, entries: semData })

  return grupos
}
