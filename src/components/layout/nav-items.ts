import type { NavIconName } from './nav-icons'

/**
 * Uma cor por destino, e a MESMA cor sempre.
 *
 * É o que faz a cor virar identificador de lugar na aplicação em vez de
 * enfeite: quem chega em Viagens reconhece o oliva antes de ler a palavra. Os
 * quatro matizes são vizinhos e têm a mesma leveza — nenhum azul de SaaS.
 * Ver ADR 0011 e ADR 0016.
 *
 * Mora fora do `TopBar` desde que a navegação passou a existir em dois lugares:
 * barra do topo no desktop, barra inferior no celular. Duas listas divergiriam
 * no dia em que um destino entrasse — e o destino novo apareceria numa tela e
 * não na outra, sem erro nenhum.
 */
export const NAV_ITEMS = [
  { href: '/', label: 'Explorar', icon: 'explorar', tint: 'nav-explorar' },
  {
    href: '/descobrir',
    label: 'Descobrir',
    icon: 'descobrir',
    tint: 'nav-descobrir',
  },
  { href: '/viagens', label: 'Viagens', icon: 'viagens', tint: 'nav-viagens' },
  {
    href: '/memorias',
    label: 'Memórias',
    icon: 'memorias',
    tint: 'nav-memorias',
  },
] as const satisfies ReadonlyArray<{
  href: string
  label: string
  icon: NavIconName
  tint: string
}>

/**
 * Explorar mora em `/` e casaria com tudo. Os outros casam por prefixo, para
 * que `/viagens/serra-do-rio-do-rastro` continue acendendo Viagens.
 */
export function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}
