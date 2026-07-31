'use client'

import { formatCoordinate } from '@/domain/geo'
import { useVisiblePlaceCount } from '@/components/explore/visible-places-context'
import { useMapView } from '@/components/map/map-context'
import { usePickerState } from '@/components/map/picker-context'
import { cn } from '@/lib/utils/cn'
import { useOrigin } from './origin-context'

/** Célula do mostrador. O filete entre elas vem do `divide-x` do contêiner. */
function Cell({
  children,
  className,
  ...rest
}: React.ComponentProps<'span'>) {
  return (
    <span
      className={cn(
        'instrument-value flex h-7 items-center px-3 text-micro whitespace-nowrap',
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}

/**
 * Mostrador do mapa: uma cápsula no canto inferior esquerdo.
 *
 * Deixou de ser uma barra de largura total. Ocupando a tela inteira embaixo, ela
 * reivindicava a importância de uma barra de ferramentas para quatro leituras
 * que ninguém aciona — e comia 36px de mapa de ponta a ponta. Como cápsula, ela
 * é o que sempre foi: um instrumento pequeno, no canto, que se lê de relance.
 *
 * Some abaixo de 768px. Lá a folha inferior já ocupa 45vh e a contagem de
 * lugares aparece no cabeçalho dela — repetir aqui custaria mapa numa tela que
 * já tem pouco.
 */
export function StatusBar() {
  const view = useMapView()
  const count = useVisiblePlaceCount()
  const { label: originLabel } = useOrigin()
  const { active: picking, cursor } = usePickerState()

  // Durante a mira, a coordenada deixa de ser mostrador e vira instrumento: o
  // número que se lê é exatamente o que vai ser gravado.
  const shown = picking ? cursor : (view?.center ?? null)

  return (
    /* Flutuante como o resto do cromo. Ver ADR 0010. */
    <footer
      className="chrome-capsule absolute bottom-(--chrome-gap) left-(--chrome-gap)
                 z-(--z-bar) hidden h-(--status-height) items-center divide-x
                 divide-line overflow-hidden rounded-full text-ink-faint md:flex"
    >
      <Cell className={picking ? 'text-accent' : 'text-ink-muted'}>
        {picking ? 'MIRA ' : '⌖ '}
        {shown
          ? `${formatCoordinate(shown.latitude)} ${formatCoordinate(shown.longitude)}`
          : '—.———— —.————'}
      </Cell>

      <Cell>Z {view ? view.zoom.toFixed(1) : '—'}</Cell>

      {count !== null ? (
        // `key` remonta o nó e reinicia o realce a cada valor novo. Sem ele o
        // número muda a 12px num canto e ninguém percebe que filtrar fez algo.
        // `data-motion="signal"`: sobrevive a movimento reduzido de propósito,
        // porque carrega informação.
        <Cell key={count} className="value-changed" data-motion="signal">
          {count} {count === 1 ? 'LUGAR' : 'LUGARES'}
        </Cell>
      ) : null}

      {/* Sem origem definida o campo some, em vez de mostrar um lugar que não é
          o seu. É o mesmo princípio do resto: não inventar dado. */}
      {originLabel ? <Cell>⌂ {originLabel}</Cell> : null}
    </footer>
  )
}
