'use client'

import {
  describeOpeningHours,
  formatMeters,
  type FuelStation,
} from '@/domain/fuel-stations'
import type { Coordinates } from '@/domain/geo'
import { googleMapsDirectionUrl } from '@/domain/google-maps-link'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/cn'

interface FuelStationRowProps {
  station: FuelStation
  selected: boolean
  onSelect: (id: string) => void
  onCenter: (station: FuelStation) => void
  /** Partida da rota. `null` quando o perfil não tem origem definida. */
  origin: Coordinates | null
}

/**
 * Um posto na lista, e o seu detalhe quando escolhido.
 *
 * **Só aparece o que existe.** Bandeira, endereço e horário são tags do
 * OpenStreetMap: um posto tem os três, o vizinho não tem nenhum. Cada bloco é
 * condicional, e não há rótulo com travessão no lugar do dado — um campo vazio
 * ocupa a mesma altura de um cheio e ensina a pessoa a ignorar a linha inteira.
 *
 * O detalhe abre **dentro da própria linha**, e não num painel novo: a lista é a
 * comparação — "qual destes?" — e trocar a lista por uma ficha desfaria a
 * pergunta a cada toque. É o mesmo raciocínio que fez o painel de lugar
 * substituir a lista da Descoberta, aplicado ao contrário porque a pergunta aqui
 * é outra.
 */
export function FuelStationRow({
  station,
  selected,
  onSelect,
  onCenter,
  origin,
}: FuelStationRowProps) {
  const hours = describeOpeningHours(station.openingHours)
  const local = [station.city, station.state].filter(Boolean).join(' · ')

  return (
    <li className={cn('border-b border-line', selected && 'bg-overlay')}>
      <button
        type="button"
        onClick={() => onSelect(station.id)}
        aria-expanded={selected}
        className={cn(
          'flex w-full items-center gap-3.5 px-4 text-left transition-colors',
          // 64px de piso, como a lista de lugares: a linha carrega nome, local
          // e uma leitura com régua, e é alvo de toque.
          'min-h-16 py-2.5',
          !selected && 'hover:bg-overlay',
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-body text-ink">
            {station.name}
          </span>
          {station.brand || local ? (
            <span className="mt-1 block truncate text-micro tracking-[0.1em] text-ink-faint uppercase">
              {[station.brand, local].filter(Boolean).join(' · ')}
            </span>
          ) : null}
        </span>

        {/*
          Régua SÓLIDA, e o valor sem `~`.

          Ela é medida de verdade: o provedor devolve a distância em linha reta
          entre o ponto consultado e o posto, e é exatamente isso que está
          escrito. Não é a estimativa de estrada do catálogo — aquela multiplica
          a linha reta por um fator de sinuosidade e por isso leva `~` e régua
          tracejada. A nota diz qual das duas é.
        */}
        {station.distanceMeters !== null ? (
          <span className="flex w-20 shrink-0 flex-col items-end gap-1.75">
            <span className="instrument-value text-small whitespace-nowrap text-ink-muted">
              {formatMeters(station.distanceMeters)}
            </span>
            <span
              aria-hidden
              className="instrument-rule instrument-rule--measured w-full min-w-0"
            />
          </span>
        ) : (
          // Sem distância informada, régua pontilhada e travessão — nunca um
          // palpite. Ver ADR 0016.
          <span className="flex w-20 shrink-0 flex-col items-end gap-1.75">
            <span className="instrument-value text-small text-ink-faint">—</span>
            <span
              aria-hidden
              className="instrument-rule instrument-rule--unknown w-full min-w-0"
            />
          </span>
        )}
      </button>

      {selected ? (
        <div className="flex flex-col gap-3 px-4 pb-4">
          {station.address ? (
            <p className="text-small leading-relaxed text-ink-muted">
              {station.address}
            </p>
          ) : null}

          {hours ? (
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="instrument-label">Horário</span>
              <span className="instrument-value text-small text-ink">
                {hours}
              </span>
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => onCenter(station)}>
              Centralizar no mapa
            </Button>

            {/* A fronteira declarada do produto: o Rastro escolhe a parada, o
                Google traça o caminho. Ver `google-maps-link.ts`. */}
            <a
              href={googleMapsDirectionUrl(station, origin)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="sm" variant="solid">
                Traçar rota até aqui
              </Button>
            </a>
          </div>
        </div>
      ) : null}
    </li>
  )
}
