import { describeOpeningHours, formatMeters } from '@/domain/fuel-stations'
import { googleMapsDirectionUrl } from '@/domain/google-maps-link'
import { SectionHeader } from '@/components/ui/Section'
import type { RefuelStopStations } from './RouteFuel'

interface RouteFuelPanelProps {
  stops: RefuelStopStations[]
  /** Autonomia já descontada a reserva. É o que espaça as paradas. */
  usableRangeKm: number
  /** Paradas que o teto de consulta deixou de fora. */
  omitted: number
}

/**
 * Os postos de cada ponto onde o tanque acaba.
 *
 * A leitura que importa não é "existe posto perto": é **a que quilômetro da sua
 * viagem** e **a que distância do traçado**. Por isso a parada vem primeiro, com
 * o quilômetro em mono, e o posto vem indentado embaixo dela — a hierarquia é a
 * da estrada, não a do catálogo.
 */
export function RouteFuelPanel({
  stops,
  usableRangeKm,
  omitted,
}: RouteFuelPanelProps) {
  return (
    <section className="border-b border-line px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <SectionHeader label="Onde abastecer" />
        {/* A conta que espaça as paradas, dita uma vez. Sem ela, "km 255"
            parece um número escolhido a esmo. */}
        <span className="instrument-label text-ink-faint">
          {usableRangeKm} km úteis
        </span>
      </div>

      <ul className="mt-3 flex flex-col gap-4">
        {stops.map((stop) => (
          <li key={stop.atKm}>
            <span className="instrument-value text-small text-accent">
              km {stop.atKm}
            </span>

            <ul className="mt-1.5">
              {stop.stations.map((station) => {
                const hours = describeOpeningHours(station.openingHours)
                return (
                  <li key={station.id} className="border-t border-line">
                    <a
                      href={googleMapsDirectionUrl(station)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="press flex min-h-11 items-center gap-3 py-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-small text-ink">
                          {station.name}
                        </span>
                        {/* Só o que existe. Posto sem bandeira e sem horário
                            mapeados não ganha uma linha vazia. */}
                        {station.brand || hours ? (
                          <span className="block truncate text-micro text-ink-faint">
                            {[station.brand, hours].filter(Boolean).join(' · ')}
                          </span>
                        ) : null}
                      </span>

                      {/*
                        Régua SÓLIDA e sem `~`: é a distância medida em linha
                        reta entre o posto e o ponto do traçado onde o tanque
                        acaba. Não é distância de estrada, e a nota do rodapé
                        diz isso — mas também não é conta em cima de conta, que
                        é o que a régua tracejada marca no resto do produto.
                      */}
                      {station.distanceMeters !== null ? (
                        <span className="flex w-16 shrink-0 flex-col items-end gap-1">
                          <span className="instrument-value text-micro whitespace-nowrap text-ink-muted">
                            {formatMeters(station.distanceMeters)}
                          </span>
                          <span
                            aria-hidden
                            className="instrument-rule instrument-rule--measured w-full min-w-0"
                          />
                        </span>
                      ) : (
                        <span className="flex w-16 shrink-0 flex-col items-end gap-1">
                          <span className="instrument-value text-micro text-ink-faint">
                            —
                          </span>
                          <span
                            aria-hidden
                            className="instrument-rule instrument-rule--unknown w-full min-w-0"
                          />
                        </span>
                      )}
                    </a>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>

      {/* O teto de consulta dito em voz alta. Silenciá-lo faria três paradas
          parecerem a viagem inteira — e numa volta de 1.200 km isso é a
          diferença entre um plano e uma surpresa no acostamento. */}
      {omitted > 0 ? (
        <p className="mt-3 text-small leading-relaxed text-ink-muted">
          Esta viagem pede mais {omitted}{' '}
          {omitted === 1 ? 'parada' : 'paradas'} além das que estão aqui.
        </p>
      ) : null}

      {/* Mesma obrigação do painel de postos do Explorar: ODbL exige o crédito
          ao OpenStreetMap, e o plano gratuito da Geoapify exige o dela com link
          seguível. */}
      <p className="mt-3 text-micro leading-relaxed text-ink-faint">
        Postos do{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent"
        >
          © OpenStreetMap contributors
        </a>
        , via{' '}
        <a
          href="https://www.geoapify.com/"
          target="_blank"
          rel="noopener"
          className="hover:text-accent"
        >
          Geoapify
        </a>
        . Distância em linha reta até o ponto do traçado, não por estrada.
      </p>
    </section>
  )
}
