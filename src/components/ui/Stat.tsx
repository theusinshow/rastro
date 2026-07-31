import { cn } from '@/lib/utils/cn'

/**
 * De onde veio o número.
 *
 * - `measured` — nós medimos. Estrada do roteador, altitude do modelo de
 *   elevação, contagem de km de uma viagem gravada.
 * - `estimated` — é conta. Linha reta vezes sinuosidade, tempo a 60 km/h. O
 *   valor **precisa** vir prefixado com `~`.
 * - `unknown` — ninguém sabe. O valor é `—`, nunca um palpite.
 * - `count` — número exato de coisas que existem. Não é medição nem estimativa,
 *   e por isso a régua é surda: presente para a forma não variar, sem
 *   reivindicar precisão de instrumento.
 */
export type StatOrigin = 'measured' | 'estimated' | 'unknown' | 'count'

const RULE: Record<StatOrigin, string> = {
  measured: 'instrument-rule--measured',
  estimated: 'instrument-rule--estimated',
  unknown: 'instrument-rule--unknown',
  count: 'instrument-rule--count',
}

interface StatProps {
  label: string
  value: string
  /** Vai embaixo da régua: "metros", "linha reta", "a 60 km/h". */
  note?: string
  origin?: StatOrigin
  className?: string
}

/**
 * Par rótulo/valor no vocabulário de instrumento, apoiado na régua.
 *
 * A régua de 2px é o que diz de onde o número veio, **antes** de qualquer
 * legenda: sólida quando medimos, tracejada quando é conta, pontilhada quando
 * não sabemos. É a faixa central da estrada — a mesma da perna do R e a mesma do
 * traçado da viagem no mapa. Interrompido é exatamente o que um número estimado
 * é, e a forma sobrevive à luva e ao sol porque é geometria de 2×48px, não um
 * glifo de 12px.
 *
 * `Stat` sem régua é defeito, não é variação de estilo.
 */
export function Stat({
  label,
  value,
  note,
  origin = 'measured',
  className,
}: StatProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.75', className)}>
      <span className="instrument-label truncate">{label}</span>
      <span className="instrument-value text-lead leading-none text-ink">
        {value}
      </span>
      <span aria-hidden className={cn('instrument-rule', RULE[origin])} />
      {note ? <span className="instrument-label truncate">{note}</span> : null}
    </div>
  )
}
