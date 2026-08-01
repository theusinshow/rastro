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
 *
 * A partir de 768px ele centraliza **na área de mapa**, não na viewport: a
 * trilha de 232px empurra o centro óptico 116px para a direita, e centralizar na
 * página deixava o botão visivelmente à esquerda do mapa que ele comanda. O
 * deslocamento lê `--panel-narrow`, então mudar a largura da trilha move o botão
 * junto.
 */
export function DiscoveryLauncher() {
  return (
    <Link
      href="/descobrir"
      className="press pointer-events-auto absolute
                 bottom-[calc(var(--sheet-height)+var(--status-height)+var(--chrome-gap)*3)]
                 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-lg
                 border border-accent bg-base/85 px-5 py-3 whitespace-nowrap
                 backdrop-blur-sm hover:bg-accent/10
                 md:bottom-[calc(var(--status-height)+var(--chrome-gap)*2)]
                 md:left-[calc(var(--panel-narrow)+var(--chrome-gap))]
                 md:right-(--chrome-gap) md:mx-auto md:w-fit md:translate-x-0"
    >
      {/*
        Duas linhas, e não uma.

        A pergunta sozinha não dizia o que o botão entrega — quem chega não sabe
        se vai abrir um formulário longo, um mapa de tudo ou uma resposta. A
        segunda linha é a promessa, no vocabulário do produto: o que você
        informa, e o que volta.
      */}
      <span className="flex flex-col gap-0.5 text-left">
        <span
          className="text-small font-semibold tracking-[0.16em] text-accent
                     uppercase"
        >
          Para onde vamos hoje?
        </span>
        <span className="text-micro leading-snug text-ink-faint normal-case">
          Tempo, distância e o destino que cabe
        </span>
      </span>

      <span aria-hidden className="text-lead leading-none text-accent">
        →
      </span>
    </Link>
  )
}
