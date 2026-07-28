/**
 * Marca do Rastro: um R cuja perna é uma estrada terminando num destino.
 *
 * A geometria da letra e da estrada é a mesma de `src/app/icon.svg` — ao mexer
 * numa, mexa na outra. O Next exige um arquivo estático para o favicon, então os
 * dois não podem compartilhar código.
 *
 * O desenho muda por faixa de tamanho, e isso é decisão, não conveniência:
 *
 * - **Abaixo de 48px** a estrada é um traço liso e o destino é um ponto cheio. O
 *   tracejado vira borrão e o anel rouba âmbar de um desenho que já tem pouco.
 * - **De 48px para cima** entram a faixa central — o sinal mais direto de
 *   "estrada" que existe — e o pin de anel, que ecoa a linguagem dos pins do
 *   mapa (miolo colorido, anel externo; ver ADR 0005). Aí a marca passa a ser
 *   literalmente um lugar no mapa no fim de uma estrada.
 */
const DETAIL_FROM = 48

interface LogoProps {
  /** Lado do quadrado, em px. Decide qual das duas versões é desenhada. */
  size?: number
  /** Placa de fundo arredondada. Ícone de app usa; dentro da interface, não. */
  plate?: boolean
  className?: string
}

const ROAD_PATH = 'M30 33q4 10 11 15'

export function Logo({ size = 24, plate = false, className }: LogoProps) {
  const detailed = size >= DETAIL_FROM

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

      <path
        d="M19 52V12h12a10 10 0 0 1 0 20H19"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d={ROAD_PATH}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={detailed ? 7 : 6}
        strokeLinecap="round"
      />

      {detailed ? (
        <path
          d={ROAD_PATH}
          fill="none"
          stroke={plate ? 'var(--color-base)' : 'var(--color-void)'}
          strokeWidth={1.6}
          strokeDasharray="2.2 3.4"
          strokeLinecap="round"
        />
      ) : null}

      {detailed ? (
        <>
          <circle
            cx="45.5"
            cy="51"
            r="5.4"
            fill="none"
            stroke="var(--color-ink)"
            strokeWidth={2}
          />
          <circle cx="45.5" cy="51" r="2.6" fill="var(--color-accent)" />
        </>
      ) : (
        <circle cx="45.5" cy="51" r="4" fill="var(--color-accent)" />
      )}
    </svg>
  )
}
