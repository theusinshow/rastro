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
  /** Lugar a que a entrada se refere. Ausente numa viagem, que passa por vários. */
  placeSlug?: string
  /** Só em viagem, e só quando medida. `null` quando a viagem não tem distância. */
  distanceKm?: number | null
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

/** O balanço de um ano. Contagens, nunca médias: média de viagem não é memória. */
export interface YearInReview {
  /** `'2026'`. */
  year: string
  tripCount: number
  /**
   * Soma das viagens **medidas** daquele ano.
   *
   * Viagem sem distância gravada não entra, e `measuredTrips` diz de quantas
   * este número saiu — sem isso, "1.240 km" pareceria o total do ano quando
   * pode ser o total de metade dele.
   */
  distanceKm: number
  measuredTrips: number
  /** Lugares distintos com visita registrada no ano. */
  placeCount: number
  photoCount: number
  /**
   * `'2026-03'`, o mês com mais coisa registrada.
   *
   * `null` quando tudo aconteceu num mês só: eleger "o mês mais cheio" entre um
   * único mês não é uma leitura, é uma frase.
   */
  busiestMonth: string | null
}

/** O ano mais recente com alguma coisa registrada. `null` quando não há nada. */
export function mostRecentYear(entries: readonly MemoryEntry[]): string | null {
  let recente: string | null = null
  for (const entry of entries) {
    if (!entry.on) continue
    const year = entry.on.slice(0, 4)
    if (recente === null || year > recente) recente = year
  }
  return recente
}

/**
 * O que ficou de um ano.
 *
 * `null` quando o ano não tem nada — a tela não mostra um balanço de zeros, que
 * seria um calendário de ausências com outro nome (a mesma razão de
 * `groupByMonth` omitir mês vazio).
 *
 * Entrada sem data fica de fora de propósito: uma foto sem EXIF não pertence a
 * ano nenhum, e chutar o ano em que ela foi subida inventaria memória.
 */
export function summarizeYear(
  entries: readonly MemoryEntry[],
  year: string,
): YearInReview | null {
  const doAno = entries.filter((entry) => entry.on?.slice(0, 4) === year)
  if (doAno.length === 0) return null

  const porMes = new Map<string, number>()
  const lugares = new Set<string>()
  let tripCount = 0
  let measuredTrips = 0
  let distanceKm = 0
  let photoCount = 0

  for (const entry of doAno) {
    const month = entry.on?.slice(0, 7)
    if (month) porMes.set(month, (porMes.get(month) ?? 0) + 1)

    if (entry.kind === 'trip') {
      tripCount += 1
      if (typeof entry.distanceKm === 'number') {
        distanceKm += entry.distanceKm
        measuredTrips += 1
      }
    }
    if (entry.kind === 'photo') photoCount += 1
    // Só visita conta lugar: uma foto prova que você esteve lá, mas é a visita
    // que você declarou. Contar as duas somaria a mesma ida duas vezes.
    if (entry.kind === 'visit' && entry.placeSlug) lugares.add(entry.placeSlug)
  }

  let busiestMonth: string | null = null
  let maior = 0
  for (const [month, total] of porMes.size > 1 ? porMes : []) {
    // Empate fica com o mês mais recente: é o que a pessoa lembra melhor.
    if (total > maior || (total === maior && busiestMonth !== null && month > busiestMonth)) {
      maior = total
      busiestMonth = month
    }
  }

  return {
    year,
    tripCount,
    distanceKm: Math.round(distanceKm),
    measuredTrips,
    placeCount: lugares.size,
    photoCount,
    busiestMonth,
  }
}
