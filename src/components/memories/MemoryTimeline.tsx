import Link from 'next/link'
import { formatVisitDate } from '@/domain/dates'
import { groupByMonth, monthLabel, type MemoryEntry } from '@/domain/memory'

const KIND_LABEL: Record<MemoryEntry['kind'], string> = {
  visit: 'visita',
  trip: 'viagem',
  photo: 'foto',
}

interface MemoryTimelineProps {
  entries: MemoryEntry[]
  /** Verdadeiro quando alguma fonte bateu no teto e a lista foi cortada. */
  truncated: boolean
}

export function MemoryTimeline({ entries, truncated }: MemoryTimelineProps) {
  const months = groupByMonth(entries)

  if (months.length === 0) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-3 px-5">
        <span className="instrument-label">Memórias</span>
        <p className="text-body leading-relaxed text-ink-muted">
          Ainda não há o que lembrar. Registre uma visita, conclua uma viagem ou
          suba uma fotografia — e o que aconteceu aparece aqui, por mês.
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {months.map((group) => (
        <section key={group.month ?? 'sem-data'}>
          {/* O cabeçalho gruda ao rolar: numa lista longa, saber em que mês se
              está é a única orientação que a tela oferece. */}
          <h2 className="instrument-label sticky top-0 z-10 border-y border-line
                         bg-base/95 px-5 py-2 backdrop-blur-sm">
            {group.month ? monthLabel(group.month) : 'sem data conhecida'}
          </h2>

          <ul>
            {group.entries.map((entry) => (
              <li key={entry.id} className="border-b border-line last:border-b-0">
                <Link
                  href={entry.href}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-overlay"
                >
                  {entry.imageUrl ? (
                    // Sem `next/image`: a URL é assinada e muda a cada leitura.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.imageUrl}
                      alt=""
                      loading="lazy"
                      className="size-12 shrink-0 rounded-sm border border-line object-cover"
                    />
                  ) : null}

                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-body text-ink">
                      {entry.title}
                    </span>
                    <span className="instrument-label flex flex-wrap items-center gap-x-2">
                      <span>{KIND_LABEL[entry.kind]}</span>
                      {entry.on ? (
                        <span className="instrument-value">
                          {formatVisitDate(entry.on)}
                        </span>
                      ) : null}
                    </span>
                    {entry.subtitle ? (
                      <span className="truncate text-small text-ink-faint">
                        {entry.subtitle}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/*
        Corte declarado. Uma lista truncada em silêncio se lê como "foi só isso
        que aconteceu" — o pior erro possível numa tela de memória.
      */}
      {truncated ? (
        <p className="border-t border-line px-5 py-4 text-small text-ink-faint">
          Mostrando as memórias mais recentes. Há mais coisa registrada do que
          cabe nesta lista.
        </p>
      ) : null}
    </div>
  )
}
