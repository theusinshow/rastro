/**
 * Glifos da navegação principal. Ver ADR 0011.
 *
 * Desenhados aqui, e não importados: quatro ícones não pagam uma dependência, e
 * o ADR 0001 já recusa esse tipo de troca. Todos compartilham o mesmo traço da
 * marca — 1.75 de espessura, pontas arredondadas, sem preenchimento — para que
 * leiam como um conjunto e não como quatro desenhos avulsos.
 *
 * `Viagens` é a curva da marca: a perna do R é uma estrada, e o glifo repete o
 * gesto. É a única peça do produto que amarra navegação e identidade.
 */
export type NavIconName = 'explorar' | 'descobrir' | 'viagens' | 'memorias'

const PATHS: Record<NavIconName, React.ReactNode> = {
  // Pino de mapa: onde as coisas estão.
  explorar: (
    <>
      <path d="M10 17.5s5.5-5 5.5-8.5a5.5 5.5 0 1 0-11 0c0 3.5 5.5 8.5 5.5 8.5Z" />
      <circle cx="10" cy="9" r="2" />
    </>
  ),
  // Bússola: para onde ir.
  descobrir: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M13 7l-1.6 4.4L7 13l1.6-4.4L13 7Z" />
    </>
  ),
  // A curva da marca, com a faixa central da estrada.
  viagens: (
    <>
      <path d="M5.5 16c0-5 6-3.5 6-8" />
      <path d="M11.5 8V4.5" strokeDasharray="1.4 2" />
      <circle cx="14.5" cy="15" r="1.8" />
    </>
  ),
  // Fotografia: o que ficou.
  memorias: (
    <>
      <rect x="3.5" y="5" width="13" height="10.5" rx="2" />
      <path d="M3.5 13l3.5-3 2.5 2.5L12 10l4.5 4" />
      <circle cx="7.5" cy="8.75" r="1" />
    </>
  ),
}

interface NavIconProps {
  name: NavIconName
  className?: string
}

/**
 * `aria-hidden` sem exceção: o glifo nunca é a única identificação de um
 * destino. O rótulo em texto anda sempre ao lado — ver ADR 0011.
 */
export function NavIcon({ name, className }: NavIconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  )
}
