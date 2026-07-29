/**
 * Marca do Rastro: um R cuja perna é a estrada.
 *
 * Construída sobre grade de 100, com um peso de traço só na letra inteira. A
 * haste e a barriga são osso; a perna sai de dentro da barriga, desce com um
 * único ponto de inflexão e pousa na mesma linha de base da haste. Um ponto de
 * inflexão só — a curva lê como serra, não como rabisco.
 *
 * A faixa central tracejada é o que faz a estrada ler como estrada: sem ela, o
 * traço âmbar tem a mesma espessura e a mesma ponta do talo, e o olho vê um
 * segundo traço da letra. O tracejado é desenhado na cor do fundo — é asfalto
 * cortado, não uma linha por cima.
 *
 * A geometria é a mesma de `src/app/icon.svg` — ao mexer numa, mexa na outra. O
 * Next exige um arquivo estático para o favicon, então as duas não podem
 * compartilhar código.
 */
const STEM = 'M30 80 V20 H53 A14 14 0 0 1 53 48 H30'
const ROAD = 'M45 48 C58 54 51 62 59 67 C64 70 66 73 70 80'

/**
 * Compensação óptica, não escala linear: quanto menor a marca, mais grosso o
 * traço. Reduzir 12 proporcionalmente até 16px deixaria a letra fina demais
 * para sobreviver ao antialiasing, e o R fecharia num borrão.
 */
function strokeFor(size: number): number {
  if (size <= 16) return 15
  if (size <= 24) return 14
  if (size < 64) return 13
  return 12
}

/**
 * Abaixo de 32px a faixa central sai. Numa marca de 24px cada tracinho mediria
 * menos de um pixel: não lê como faixa, só suja o âmbar.
 */
const DASH_MIN_SIZE = 32

/** A marca ocupa 74% do quadrado quando há placa — o resto é respiro. */
const PLATE_SCALE = 0.74

interface LogoProps {
  /** Lado do quadrado, em px. */
  size?: number
  /** Placa de fundo arredondada. Ícone de app usa; dentro da interface, não. */
  plate?: boolean
  className?: string
}

export function Logo({ size = 24, plate = false, className }: LogoProps) {
  const strokeWidth = strokeFor(size)
  const mark = (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={STEM} stroke="var(--color-ink)" strokeWidth={strokeWidth} />
      <path d={ROAD} stroke="var(--color-accent)" strokeWidth={strokeWidth} />
      {size >= DASH_MIN_SIZE ? (
        <path
          d={ROAD}
          stroke={plate ? 'var(--color-base)' : 'var(--color-void)'}
          strokeWidth={2.2}
          strokeDasharray="3.5 6"
        />
      ) : null}
    </g>
  )

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      // A marca nunca é a única fonte do nome: onde ela aparece, a palavra
      // "Rastro" aparece junto. Anunciá-la seria repetir.
      aria-hidden
      focusable="false"
    >
      {plate ? (
        <>
          <rect width="100" height="100" rx="26" fill="var(--color-base)" />
          <g
            transform={`translate(50 50) scale(${PLATE_SCALE}) translate(-50 -50)`}
          >
            {mark}
          </g>
        </>
      ) : (
        mark
      )}
    </svg>
  )
}
