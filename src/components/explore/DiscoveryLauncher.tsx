import Link from 'next/link'

/**
 * Ação primária da tela inicial.
 *
 * O preenchimento âmbar sólido voltou a significar exclusivamente "quero
 * conhecer" no mapa: um botão de navegação com o mesmo tom dos pins de dado
 * fazia o olho tratar o botão como se fosse dado. O contorno âmbar sobre `base`
 * opaco mantém a ação inequívoca sem gastar o vocabulário do mapa.
 *
 * Abaixo de 768px a trilha de filtros vira folha inferior e o botão sobe para
 * ficar acima dela. A altura da folha vem de `--sheet-height`
 * (`src/app/globals.css`), a mesma variável que `.overlay-panel` usa como
 * `max-height`: mudar a altura da folha num lugar só move o botão junto, em
 * vez de os dois números divergirem em silêncio.
 */
export function DiscoveryLauncher() {
  return (
    <Link
      href="/descobrir"
      className="press pointer-events-auto absolute bottom-[calc(var(--sheet-height)+12px)]
                 left-1/2 flex -translate-x-1/2 items-center gap-3 border
                 border-accent bg-base px-5 py-2.5 text-small font-semibold
                 tracking-[0.16em] whitespace-nowrap text-accent uppercase
                 hover:bg-accent/10 md:bottom-5"
    >
      Para onde vamos?
      <span aria-hidden>→</span>
    </Link>
  )
}
