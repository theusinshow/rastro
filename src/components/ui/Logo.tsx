/**
 * Marca do Rastro: um R cuja perna é uma estrada terminando num destino.
 *
 * A geometria é a mesma de `src/app/icon.svg` — ao mexer numa, mexa na outra. O
 * Next exige um arquivo estático para o favicon, então as duas não podem
 * compartilhar código.
 *
 * A faixa central tracejada é o que faz a estrada ler como estrada: sem ela, o
 * traço âmbar tem a mesma espessura e a mesma ponta do talo, e o olho vê um
 * segundo traço da letra. O tracejado é desenhado na cor do fundo — é asfalto
 * cortado, não uma linha por cima.
 */
const ROAD = 'M26 32c1 10 13 7 17 15'

interface LogoProps {
  /** Lado do quadrado, em px. */
  size?: number
  /** Placa de fundo arredondada. Ícone de app usa; dentro da interface, não. */
  plate?: boolean
  className?: string
}

export function Logo({ size = 24, plate = false, className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      // A marca nunca é a única fonte do nome: onde ela aparece, a palavra
      // "Rastro" aparece junto. Anunciá-la seria repetir.
      aria-hidden
      focusable="false"
    >
      {plate ? (
        <rect width="64" height="64" rx="14" fill="var(--color-base)" />
      ) : null}

      <g fill="none" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 53V11h14a9.5 9.5 0 0 1 0 19H17" stroke="var(--color-ink)" />
        <path d={ROAD} stroke="var(--color-accent)" />
        <path
          d={ROAD}
          stroke={plate ? 'var(--color-base)' : 'var(--color-void)'}
          strokeWidth={1.7}
          strokeDasharray="2.2 3.4"
        />
        <circle
          cx="48.5"
          cy="54.5"
          r="3.4"
          fill="var(--color-accent)"
          stroke="none"
        />
      </g>
    </svg>
  )
}
