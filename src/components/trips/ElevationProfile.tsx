import { formatMeters, type ElevationProfile } from '@/domain/elevation'
import { SectionHeader } from '@/components/ui/Section'
import { Stat } from '@/components/ui/Stat'

interface ElevationProfileViewProps {
  profile: ElevationProfile
}

/** Unidades internas do traçado. A largura é fluida; a altura, não. */
const VIEW_WIDTH = 1000
const VIEW_HEIGHT = 120

/**
 * Sem isto, uma estrada de planície virava uma linha colada no topo e outra no
 * fundo do quadro, e a tremida de dez metros parecia uma serra. Com um piso de
 * 200 m de amplitude, o desenho de um trecho plano fica plano.
 */
const MIN_RANGE_M = 200

/**
 * O relevo da viagem, desenhado.
 *
 * É o gráfico de um instrumento, não um widget: sem eixo decorativo, sem grade,
 * sem legenda flutuante. Duas hairlines marcam o ponto mais alto e o mais baixo,
 * e os números que importam estão escritos por extenso embaixo — em mono, como
 * todo dado numérico deste produto.
 */
export function ElevationProfileView({ profile }: ElevationProfileViewProps) {
  const { samples, lowestM, highestM, totalKm } = profile

  const range = Math.max(highestM - lowestM, MIN_RANGE_M)
  const floor = lowestM - (range - (highestM - lowestM)) / 2

  const x = (km: number) => (totalKm > 0 ? (km / totalKm) * VIEW_WIDTH : 0)
  const y = (meters: number) =>
    VIEW_HEIGHT - ((meters - floor) / range) * VIEW_HEIGHT

  const line = samples
    .map(
      (sample, index) =>
        `${index === 0 ? 'M' : 'L'}${x(sample.km).toFixed(1)} ${y(sample.meters).toFixed(1)}`,
    )
    .join(' ')

  // Fecha a área pelo rodapé do quadro, e não pela primeira altitude: o que se
  // lê embaixo da linha é terreno, não o intervalo desde o ponto de partida.
  const area = `${line} L${VIEW_WIDTH} ${VIEW_HEIGHT} L0 ${VIEW_HEIGHT} Z`

  return (
    <section className="border-b border-line px-5 py-4">
      {/* Sem quilometragem própria: a soma da polilinha dá 555 km onde o roteador
          declarou 556, e dois totais diferentes na mesma tela viram desconfiança
          em cima de um número que o cabeçalho já deu. O eixo é a viagem inteira. */}
      <SectionHeader label="Altimetria" />

      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={`Perfil de altimetria: a rota vai de ${formatMeters(lowestM)} a ${formatMeters(highestM)} metros de altitude, ${formatMeters(profile.climbM)} metros de desnível`}
        className="mt-3 h-24 w-full"
      >
        {/* `non-scaling-stroke` guarda o traço de 1px: sem ele, esticar o quadro
            na horizontal engordaria as linhas junto. */}
        <line
          x1="0"
          y1={y(highestM)}
          x2={VIEW_WIDTH}
          y2={y(highestM)}
          className="stroke-line"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1="0"
          y1={y(lowestM)}
          x2={VIEW_WIDTH}
          y2={y(lowestM)}
          className="stroke-line"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
        <path d={area} className="fill-accent/16" />
        <path
          d={line}
          fill="none"
          className="stroke-accent"
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Três leituras MEDIDAS — régua sólida —, e nenhuma acumulação. O porquê
          de não haver "subida acumulada" está em `domain/elevation.ts`. */}
      <div className="mt-4 grid grid-cols-3 gap-5">
        <Stat label="Mais baixo" value={formatMeters(lowestM)} note="metros" />
        <Stat label="Mais alto" value={formatMeters(highestM)} note="metros" />
        <Stat label="Desnível" value={formatMeters(profile.climbM)} note="metros" />
      </div>
    </section>
  )
}
