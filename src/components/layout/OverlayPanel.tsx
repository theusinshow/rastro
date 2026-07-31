import { cn } from '@/lib/utils/cn'

interface OverlayPanelProps {
  side: 'left' | 'right'
  /**
   * Largura em pixels a partir de 768px.
   *
   * Sem valor, cada lado usa o seu token: `--panel-base` à direita e
   * `--panel-narrow` à esquerda. Os números estavam literais aqui e nos tokens
   * ao mesmo tempo, e mudar a trilha exigia lembrar dos dois.
   */
  width?: number
  /**
   * Altura da folha inferior abaixo de 768px. Padrão: 45vh.
   *
   * Existe para conteúdo que não cabe na folha padrão e cuja rolagem esconderia
   * controle — o conjunto de filtros soma 538px numa folha de 380px, e sem isto
   * nenhum dos quatro controles de situação aparece sem rolar.
   */
  sheetHeight?: string
  /**
   * A saída está em andamento e o nó continua montado só para a animação
   * terminar. Ver `useExitTransition`.
   */
  exiting?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Painel sobre o mapa.
 *
 * Geometria e movimento vivem em `.overlay-panel`, em `globals.css`: abaixo de
 * 768px o painel vira folha inferior, e a entrada depende de `@starting-style`,
 * que não tem equivalente em utilitária do Tailwind.
 */
export function OverlayPanel({
  side,
  width,
  sheetHeight,
  exiting = false,
  className,
  children,
}: OverlayPanelProps) {
  return (
    <aside
      data-side={side}
      data-exiting={exiting}
      style={
        {
          // O painel do objeto selecionado é o mais largo do produto: ele
          // carrega nome de lugar, três leituras com régua, visitas e fotos.
          // A trilha da esquerda fica em `--panel-base`, que já é o que ela
          // precisava desde que o corpo passou a 17px.
          '--panel-width': width
            ? `${width}px`
            : side === 'right'
              ? 'var(--panel-wide)'
              : 'var(--panel-base)',
          ...(sheetHeight ? { '--sheet-height': sheetHeight } : {}),
        } as React.CSSProperties
      }
      // Superfície e desfoque vivem em `.overlay-panel`: o cromo inteiro é o
      // mesmo material, e declará-lo em dois lugares deixaria a barra e o painel
      // divergirem no dia em que um dos dois mudasse.
      className={cn('overlay-panel', className)}
    >
      {children}
    </aside>
  )
}
