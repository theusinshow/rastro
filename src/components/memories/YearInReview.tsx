import { monthLabel, type YearInReview } from '@/domain/memory'
import { Stat } from '@/components/ui/Stat'

interface YearInReviewProps {
  review: YearInReview
  /** Verdadeiro quando a lista de origem foi cortada — a conta cai junto. */
  truncated: boolean
}

/**
 * O balanço do ano, no topo de Memórias.
 *
 * Responde *"o que ficou desse ano?"* antes de a pessoa rolar doze meses para
 * descobrir sozinha. São leituras, não elogios: nada de "seu melhor ano!" nem
 * comparação com o ano passado, que transformaria memória em placar.
 */
export function YearInReviewPanel({ review, truncated }: YearInReviewProps) {
  const {
    year,
    tripCount,
    distanceKm,
    measuredTrips,
    placeCount,
    photoCount,
    busiestMonth,
  } = review

  const parcial = measuredTrips < tripCount

  // Só o que aconteceu. "Viagens 0" ao lado de "Fotos 0" transformaria o balanço
  // num placar de ausências — e um ano em que não se viajou já é dito pela
  // ausência da leitura, sem precisar de um zero em corpo grande.
  // Contagem é `count`, e não `measured`: três viagens não é uma medição, é o
  // número exato de coisas que existem. A quilometragem, essa sim, foi medida na
  // estrada — e ganha régua sólida.
  const figures = [
    tripCount > 0
      ? { label: 'Viagens', value: String(tripCount), origin: 'count' as const }
      : null,
    measuredTrips > 0
      ? {
          label: 'Rodados',
          value: distanceKm.toLocaleString('pt-BR'),
          note: 'quilômetros',
          origin: 'measured' as const,
        }
      : null,
    placeCount > 0
      ? { label: 'Lugares', value: String(placeCount), origin: 'count' as const }
      : null,
    photoCount > 0
      ? { label: 'Fotos', value: String(photoCount), origin: 'count' as const }
      : null,
  ].filter((figure) => figure !== null)

  if (figures.length === 0) return null

  return (
    // Card, e com a segunda camada de elevação: o balanço é uma peça só, que
    // sobe sobre a linha do tempo. Sem a elevação, ele lia como o primeiro mês
    // da lista — e é justamente o que ele não é.
    <section className="m-3 rounded-lg border border-line bg-raised px-5 py-4 shadow-lift">
      <div className="flex items-baseline justify-between">
        <h2 className="type-title text-title text-ink">O ano em revista</h2>
        <span className="instrument-value text-body text-ink-faint">{year}</span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
        {figures.map((figure) => (
          <Stat key={figure.label} {...figure} />
        ))}
      </div>

      {busiestMonth ? (
        <p className="mt-4 text-small leading-relaxed text-ink-muted">
          {monthLabel(busiestMonth)} foi o mês com mais coisa registrada.
        </p>
      ) : null}

      {parcial && measuredTrips > 0 ? (
        <p className="mt-1 text-small leading-relaxed text-ink-faint">
          A quilometragem vem de {measuredTrips} de {tripCount} viagens: o resto
          não tem distância gravada.
        </p>
      ) : null}

      {/* Mesma regra da linha do tempo: contagem cortada em silêncio se lê como
          "foi só isso que aconteceu". */}
      {truncated ? (
        <p className="mt-1 text-small leading-relaxed text-ink-faint">
          A conta cobre o que cabe nesta lista, e há mais coisa registrada.
        </p>
      ) : null}
    </section>
  )
}
