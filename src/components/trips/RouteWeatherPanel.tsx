'use client'

import { useState } from 'react'
import {
  COLD_C,
  VISIBILITY_LABELS,
  dayLabel,
  formatTemperature,
  type RoadVisibility,
  type RouteDay,
} from '@/domain/weather'
import { Chip } from '@/components/ui/Chip'
import { SectionHeader } from '@/components/ui/Section'

interface RouteWeatherPanelProps {
  days: RouteDay[]
  /** Data civil de hoje em São Paulo, vinda do servidor. */
  today: string
}

const TONE: Record<RoadVisibility, string> = {
  limpo: 'text-ink-faint',
  limitado: 'text-warn',
  fechado: 'text-alert',
}

/**
 * A condição na estrada, dia a dia e ponto a ponto.
 *
 * Responde a pergunta que faz alguém abrir a viagem numa quinta-feira: *"dá para
 * ir no fim de semana?"*. Não é um app de clima — não há ícone de nuvem, não há
 * "sensação térmica", não há semana inteira. Há a serra, a hora em que ela fecha,
 * e o frio que faz voltar.
 */
export function RouteWeatherPanel({ days, today }: RouteWeatherPanelProps) {
  const [index, setIndex] = useState(0)
  const day = days[index] ?? days[0]
  if (!day) return null

  return (
    <section className="border-b border-line px-5 py-4">
      <div className="flex items-baseline justify-between gap-3">
        <SectionHeader label="Condição na estrada" />
        {/* Previsão é previsão. Dizer isso uma vez, sempre visível, é o que
            separa este bloco dos números medidos que estão logo acima. */}
        <span className="instrument-label text-ink-faint">previsão</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {days.map((candidate, i) => (
          <Chip
            key={candidate.date}
            active={i === index}
            onClick={() => setIndex(i)}
          >
            {dayLabel(candidate.date, today)}
          </Chip>
        ))}
      </div>

      {day.worst ? (
        // Travessão, e não preposição: "Na Palhoça" sai errado, "Em Palhoça"
        // sai certo, e nada no rótulo diz qual dos dois usar.
        <p className="mt-3 text-body leading-relaxed text-ink">
          {day.worst.label} — {describeWorst(day.worst)}
        </p>
      ) : (
        <p className="mt-3 text-body leading-relaxed text-ink-muted">
          Sem neblina nem chuva provável em nenhuma parada, das 7h às 19h.
        </p>
      )}

      <ul className="mt-3">
        {day.stops.map((stop) => (
          // Duas linhas, e não uma: numa trilha de 380px, "Serra do Corvo
          // Branco" ao lado de "NEBLINA 07:00" corta o nome e quebra o rótulo
          // ao mesmo tempo — e nome de serra comprido é a regra aqui.
          <li key={stop.label} className="border-t border-line py-2">
            <span className="block truncate text-small text-ink-muted">
              {stop.label}
            </span>
            <span className="mt-0.5 flex items-baseline justify-between gap-3">
              <span className="instrument-value text-small text-ink">
                {formatTemperature(stop.minC)}
                <span className="text-ink-faint"> a </span>
                {formatTemperature(stop.maxC)}
              </span>
              <span
                className={`instrument-label shrink-0 ${TONE[stop.visibility]}`}
              >
                {describeStop(stop)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      {/* Exigido pela licença da fonte, e justo: o dado é de graça e é de alguém. */}
      <p className="mt-3 text-micro text-ink-faint">
        Previsão de{' '}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-accent"
        >
          Open-Meteo
        </a>
        , entre 7h e 19h.
      </p>
    </section>
  )
}

type StopDay = RouteDay['stops'][number]

/**
 * "Neblina", e não "fechado".
 *
 * O rótulo é colado a um nome próprio que pode ser masculino ou feminino — a
 * Serra, o Morro —, e "Serra do Corvo Branco fica fechado" sai errado. Um
 * substantivo não concorda com nada e diz a mesma coisa.
 */
function describeStop(stop: StopDay): string {
  if (stop.visibility !== 'fechado') return VISIBILITY_LABELS[stop.visibility]
  if (stop.closedHours > 1) return `neblina ${stop.closedHours}h`
  return stop.closesAt ? `neblina ${stop.closesAt}` : 'neblina'
}

function describeWorst(worst: StopDay): string {
  const partes: string[] = []

  if (worst.visibility === 'fechado') {
    partes.push(
      worst.closedHours > 1
        ? `${worst.closedHours} h de neblina a partir das ${worst.closesAt}`
        : `neblina às ${worst.closesAt}`,
    )
  } else if (worst.visibility === 'limitado') {
    partes.push('pouca visão')
  }

  if (worst.rainChance >= 50) {
    partes.push(`${worst.rainChance}% de chance de chuva`)
  }

  // O frio entra como agravante, nunca sozinho: 8 °C num dia limpo é jaqueta,
  // não é motivo para não ir.
  if (worst.minC < COLD_C) {
    partes.push(`${formatTemperature(worst.minC)} na mínima`)
  }

  // Vírgula entre os primeiros e "e" antes do último: a frase é lida, não é uma
  // lista de campos separados por vírgula.
  const ultimo = partes.pop()
  const frase = partes.length > 0 ? `${partes.join(', ')} e ${ultimo}` : ultimo

  return `${frase}.`
}
