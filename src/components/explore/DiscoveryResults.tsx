'use client'

import {
  AVERAGE_SPEED_KMH,
  RIDING_TIME_RATIO,
  TIME_BUDGET_LABELS,
  type DiscoveryQuery,
  type DiscoveryResult,
  type DiscoverySuggestion,
} from '@/domain/discovery'
import { formatDistanceKm, formatDurationMinutes } from '@/domain/geo'
import { CATEGORY_LABELS } from '@/domain/place'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { Button } from '@/components/ui/Button'
import { VisitStatusBadge } from './VisitStatusBadge'

/** O que o botão de recuperação promete, na linguagem da própria consulta. */
function suggestionLabel(suggestion: DiscoverySuggestion): string {
  const destinos = `${suggestion.count} ${suggestion.count === 1 ? 'destino' : 'destinos'}`

  switch (suggestion.relaxation) {
    case 'maxDistanceKm':
      return `Ampliar para ${suggestion.query.maxDistanceKm} km — ${destinos}`
    case 'timeBudget':
      return `Considerar ${TIME_BUDGET_LABELS[suggestion.query.timeBudget]} — ${destinos}`
    case 'categories':
      return `Aceitar qualquer categoria — ${destinos}`
  }
}

interface DiscoveryResultsProps {
  results: DiscoveryResult[]
  onSelect: (slug: string) => void
  onHover: (slug: string | null) => void
  /** Menor ampliação de limite que devolveria destinos. */
  suggestion: DiscoverySuggestion | null
  onApplySuggestion: (query: DiscoveryQuery) => void
  exiting?: boolean
}

export function DiscoveryResults({
  results,
  onSelect,
  onHover,
  suggestion,
  onApplySuggestion,
  exiting,
}: DiscoveryResultsProps) {
  return (
    <OverlayPanel side="right" width={340} exiting={exiting}>
      <header className="shrink-0 border-b border-line px-5 py-4">
        <span className="instrument-label">Destinos possíveis</span>
        <p className="instrument-value mt-1 text-title text-ink">{results.length}</p>
      </header>

      {results.length === 0 ? (
        <div className="empty-state flex flex-1 flex-col justify-center gap-3 px-5">
          <p className="text-base leading-relaxed text-ink-muted">
            Nenhum destino cabe nesses limites.
          </p>
          {suggestion ? (
            <>
              <p className="text-small leading-relaxed text-ink-faint">
                O menor ajuste que devolve resultado:
              </p>
              <Button
                size="sm"
                className="h-auto w-full py-1.5"
                onClick={() => onApplySuggestion(suggestion.query)}
              >
                {suggestionLabel(suggestion)}
              </Button>
            </>
          ) : (
            <p className="text-small leading-relaxed text-ink-faint">
              Nem ampliando distância, tempo e categorias aparece destino. Remova
              o filtro de favoritos ou o de não visitados.
            </p>
          )}
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {results.map((result, index) => (
            <li
              key={result.place.slug}
              // A lista é a resposta a uma pergunta que o usuário acabou de
              // fazer. O escalonamento faz a resposta ler como produzida agora
              // e estabelece a ordem de leitura, que aqui não é óbvia: a
              // ordenação vai do mais distante ao mais próximo.
              className="stagger-item"
              style={{ '--stagger-index': index } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={() => onSelect(result.place.slug)}
                onMouseEnter={() => onHover(result.place.slug)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(result.place.slug)}
                onBlur={() => onHover(null)}
                className="w-full border-b border-line px-5 py-3.5 text-left
                           transition-colors hover:bg-overlay"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-base text-ink">{result.place.name}</span>
                  <span className="instrument-value shrink-0 text-small text-accent">
                    {formatDistanceKm(result.estimatedRoadKm)} km
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-micro tracking-[0.1em] text-ink-faint uppercase">
                    {CATEGORY_LABELS[result.place.category]}
                  </span>
                  <span className="instrument-value text-micro text-ink-faint">
                    {formatDurationMinutes(result.estimatedRoundTripMinutes)} ida
                    e volta
                  </span>
                </div>
                <div className="mt-1.5">
                  <VisitStatusBadge status={result.place.visitStatus} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Os números vêm das constantes do domínio: elas existem para serem
          calibradas com dados reais, e um literal aqui passaria a mentir sobre
          como a estimativa foi produzida no dia da calibragem. */}
      <p className="shrink-0 border-t border-line px-5 py-3 text-micro leading-relaxed text-ink-faint">
        Estimativas em linha reta com fator de estrada, a {AVERAGE_SPEED_KMH}{' '}
        km/h médios, reservando {Math.round((1 - RIDING_TIME_RATIO) * 100)}% do
        tempo para paradas. Não substituem um roteador.
      </p>
    </OverlayPanel>
  )
}
