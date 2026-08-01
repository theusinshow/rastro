'use client'

import { useState } from 'react'

import {
  AVERAGE_SPEED_KMH,
  RIDING_TIME_RATIO,
  TIME_BUDGET_LABELS,
  estimateReturnAt,
  type DiscoveryQuery,
  type DiscoveryResult,
  type DiscoverySuggestion,
} from '@/domain/discovery'
import { formatClock } from '@/domain/dates'
import { planRefuelStops } from '@/domain/fuel'
import { formatDistanceKm, formatDurationMinutes } from '@/domain/geo'
import { ACCESS_SURFACE_SHORT, CATEGORY_LABELS } from '@/domain/place'
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
    case 'onlyUnvisited':
      return `Incluir lugares já visitados — ${destinos}`
    case 'onlyFavorites':
      return `Incluir lugares fora dos favoritos — ${destinos}`
  }
}

interface DiscoveryResultsProps {
  results: DiscoveryResult[]
  onSelect: (slug: string) => void
  onHover: (slug: string | null) => void
  /** Menor ampliação de limite que devolveria destinos. */
  suggestion: DiscoverySuggestion | null
  onApplySuggestion: (query: DiscoveryQuery) => void
  /**
   * Distância até o lugar mais próximo do catálogo, ignorando todo filtro.
   *
   * É o que distingue "seus filtros estão apertados" de "não há nada perto de
   * você". Sem ela, o vazio dava um conselho que não tinha como funcionar.
   */
  nearestKm: number | null
  /** Autonomia da moto. `null` = o produto não opina sobre combustível. */
  autonomyKm: number | null
  exiting?: boolean
}

export function DiscoveryResults({
  results,
  onSelect,
  onHover,
  suggestion,
  onApplySuggestion,
  nearestKm,
  autonomyKm,
  exiting,
}: DiscoveryResultsProps) {
  /*
   * A hora da partida, congelada na montagem.
   *
   * `new Date()` no corpo do render faria o horário de retorno andar sozinho a
   * cada re-render — o número mudaria enquanto a pessoa lê, o que é exatamente o
   * que um instrumento não pode fazer.
   */
  const [departure] = useState(() => new Date())

  return (
    <OverlayPanel side="right" exiting={exiting}>
      <header className="shrink-0 border-b border-line px-5 py-4">
        <span className="instrument-label">Destinos possíveis</span>
        <p className="instrument-value mt-1 text-title text-ink">{results.length}</p>
      </header>

      {results.length === 0 ? (
        <div className="empty-state flex flex-1 flex-col justify-center gap-3 px-5">
          <p className="text-body leading-relaxed text-ink-muted">
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
          ) : nearestKm !== null ? (
            /*
             * Nenhuma folga resolve — nem os alternadores, que agora entram na
             * busca por sugestão. Então a causa não é o filtro, é o alcance: o
             * catálogo não tem nada perto desta partida.
             *
             * Dizer a distância é o que torna isso acionável. "Remova um filtro"
             * era conselho impossível de seguir quando filtro nenhum estava
             * ligado — e foi o que a auditoria encontrou em RASTRO-007.
             */
            <p className="text-small leading-relaxed text-ink-faint">
              Nenhum filtro explica este vazio: o lugar mais próximo do catálogo
              está a{' '}
              <span className="instrument-value">
                ~ {Math.round(nearestKm)} km
              </span>{' '}
              da sua partida. O Rastro ainda cobre só Santa Catarina.
            </p>
          ) : (
            <p className="text-small leading-relaxed text-ink-faint">
              O catálogo está vazio.
            </p>
          )}
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {results.map((result, index) => {
            const volta = estimateReturnAt(
              departure,
              result.estimatedRoundTripMinutes,
            )
            // Ida e volta: o tanque precisa dar conta do caminho todo, e é o
            // caminho todo que a pessoa vai rodar.
            const plano = planRefuelStops(
              result.estimatedRoadKm * 2,
              autonomyKm,
            )

            return (
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
                  <span className="text-body text-ink">{result.place.name}</span>
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

                {/*
                  As três leituras que decidem o passeio, e que a auditoria
                  encontrou ausentes (RASTRO-005): a que horas você volta, se a
                  volta cabe no tanque, e se dá para chegar de moto de rua.

                  Ficam ABAIXO da distância e da duração de propósito — são o
                  segundo olhar, depois de "cabe no meu tempo?". E ficam antes do
                  estado de visita, que é o menos decisivo dos quatro.
                */}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="instrument-value text-micro text-ink-muted">
                    ~ de volta às {formatClock(volta)}
                  </span>

                  {/* Só aparece quando há autonomia informada. Sem ela o produto
                      não opina sobre combustível — inventar uma média seria
                      inventar dado sobre a moto de outra pessoa. */}
                  {plano ? (
                    <span
                      className={
                        plano.fitsInOneTank
                          ? 'instrument-value text-micro text-ink-faint'
                          : 'instrument-value text-micro text-accent'
                      }
                    >
                      {plano.fitsInOneTank
                        ? 'cabe no tanque'
                        : `abastece ${plano.stops}×`}
                    </span>
                  ) : null}

                  {/* O piso já existia no banco desde a migration 0007 e nunca
                      aparecia onde a escolha acontece. Nulo NÃO vira "asfalto":
                      quando não se sabe, não se diz. */}
                  {result.place.accessSurface ? (
                    <span className="text-micro tracking-[0.1em] text-ink-faint uppercase">
                      {ACCESS_SURFACE_SHORT[result.place.accessSurface]}
                    </span>
                  ) : null}
                </div>

                <div className="mt-1.5">
                  <VisitStatusBadge status={result.place.visitStatus} />
                </div>
              </button>
            </li>
            )
          })}
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
