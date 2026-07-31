/**
 * Glifos da navegação principal. Ver ADR 0016.
 *
 * Desenhados aqui, e não importados: quatro ícones não pagam uma dependência, e
 * o ADR 0001 já recusa esse tipo de troca. Todos compartilham o mesmo traço da
 * marca — 1.75 de espessura, pontas arredondadas, sem preenchimento — para que
 * leiam como um conjunto e não como quatro desenhos avulsos.
 *
 * `Viagens` é a curva da marca: a perna do R é uma estrada, e o glifo repete o
 * gesto. É a única peça do produto que amarra navegação e identidade.
 *
 * `Memórias` deixou de ser uma fotografia e passou a ser linhas de linha do
 * tempo. O motivo é que a tela deixou de ser sobre fotos: ela guarda visita,
 * viagem e foto, e uma foto no glifo prometia só um dos três.
 */
export type NavIconName = 'explorar' | 'descobrir' | 'viagens' | 'memorias'

/**
 * Comprimento do traço de cada glifo, para o desenho de entrada.
 *
 * Um valor por glifo, com folga: `stroke-dasharray` maior que o traço real só
 * significa que o desenho termina antes do fim da animação, e isso é invisível.
 * Menor cortaria o glifo no meio, que é visível e errado.
 */
const DRAW_LENGTH = 96

const PATHS: Record<NavIconName, React.ReactNode> = {
  // Pino de mapa: onde as coisas estão.
  explorar: (
    <>
      <path d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  // Bússola: para onde ir.
  descobrir: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.6 8.4 13.4 13.4 8.4 15.6 10.6 10.6z" />
    </>
  ),
  // A curva da marca: a estrada que sobe, com a seta de quem vai.
  viagens: (
    <>
      <path d="M5 20c4.4 0 4.4-7 8-7s3.5-3 3.5-3" />
      <path d="M16.5 6.6 19.4 10 16.4 13.2" />
    </>
  ),
  // Linhas de linha do tempo, com a marca do que ficou.
  memorias: (
    <>
      <path d="M4 6.5h10M4 12h16M4 17.5h7" />
      <path d="M18.5 5.4v2.6" />
    </>
  ),
}

interface NavIconProps {
  name: NavIconName
  /** O glifo redesenha o próprio traço ao assumir o destino. */
  drawing?: boolean
  className?: string
}

/**
 * `aria-hidden` sem exceção: o glifo nunca é a única identificação de um
 * destino. O rótulo em texto anda sempre ao lado — ver ADR 0016.
 *
 * Quando `drawing`, o traço se redesenha em `--dur-draw`. É informação, não
 * enfeite: diz *"este é o destino que acabou de assumir"*. Fica na camada
 * zerada de movimento reduzido porque a forma final, sozinha, já diz o estado —
 * e por isso o `data-motion="decor"`, que também alcança o SVG, que não é
 * governado por token de duração.
 */
export function NavIcon({ name, drawing, className }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={
        drawing
          ? {
              strokeDasharray: DRAW_LENGTH,
              animation: `nav-draw var(--dur-draw) var(--ease-out-quint) backwards`,
            }
          : undefined
      }
      data-motion={drawing ? 'decor' : undefined}
      aria-hidden
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
