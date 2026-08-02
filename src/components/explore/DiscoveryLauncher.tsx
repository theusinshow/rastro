import Link from 'next/link'

/**
 * Ação primária da tela inicial.
 *
 * O preenchimento âmbar sólido voltou a significar exclusivamente "quero
 * conhecer" no mapa: um botão de navegação com o mesmo tom dos pins de dado
 * fazia o olho tratar o botão como se fosse dado. O contorno âmbar sobre `base`
 * opaco mantém a ação inequívoca sem gastar o vocabulário do mapa.
 *
 * Abaixo de 768px o botão sobe o suficiente para ficar acima da vitrine, cuja
 * altura vem de `--carousel-height` (`src/app/globals.css`) — um número num
 * lugar só, em vez de dois que divergem no dia em que um deles mudar. Antes ele
 * subia acima da folha de filtros; ela não abre mais por padrão, e
 * `--sheet-height` saiu da conta junto.
 *
 * A partir de 768px ele centraliza **na faixa de mapa que sobra à esquerda da
 * vitrine** — não na viewport.
 *
 * O lado esquerdo deixou de descontar a trilha, que não nasce mais aberta. O
 * direito desconta a vitrine, e é a mesma disciplina de antes: quando o botão
 * cresceu ignorando o painel da direita, **115px dele terminavam embaixo do
 * painel de lugar** — medido em 1440px —, e a pergunta central do produto
 * aparecia cortada no meio.
 *
 * A faixa é reservada mesmo com a vitrine escondida. É deliberado: um CTA que
 * muda de posição quando um painel abre chamaria mais atenção para o próprio
 * movimento do que para o destino.
 */
export function DiscoveryLauncher() {
  return (
    <Link
      href="/descobrir"
      /*
       * CRESCEU, e ficou opaco. As duas mudanças têm a mesma causa.
       *
       * O mapa agora passeia pelos lugares por trás dele até o primeiro gesto
       * (ver `ExploreTour`), e a superfície anterior era `base/85` com desfoque:
       * legível sobre um mapa parado, cinza sobre um mapa que se move e troca de
       * relevo a cada quatro segundos. Um CTA que pisca de contraste enquanto a
       * paisagem passa por baixo é o pior lugar da tela para economizar opacidade.
       *
       * A cápsula em relevo (`.chrome-capsule`) resolve os dois: é a MESMA
       * superfície da barra do topo e do mostrador, quase opaca, com o filete de
       * luz em cima e a aresta embaixo. O botão deixa de ser um retângulo
       * translúcido e passa a ser uma peça do cromo — o que ele sempre foi.
       *
       * O que NÃO mudou, e continua deliberado: o âmbar segue como contorno e
       * texto, nunca como preenchimento. Âmbar cheio sobre o mapa significa
       * "quero conhecer" no vocabulário dos pins, e gastar isso num botão de
       * navegação faria o olho tratar o botão como dado.
       */
      className="chrome-capsule chrome-press press pointer-events-auto absolute
                 bottom-[calc(var(--nav-height)+var(--safe-bottom)+var(--attrib-height)+var(--carousel-height)+var(--chrome-gap)*3)]
                 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-xl
                 border-accent px-6 py-4 whitespace-nowrap
                 hover:border-accent-strong hover:bg-accent/10
                 md:bottom-[calc(var(--status-height)+var(--chrome-gap)*2)]
                 md:left-(--chrome-gap)
                 md:right-[calc(var(--carousel-width)+var(--chrome-gap)*2)]
                 md:mx-auto md:w-fit md:translate-x-0
                 md:gap-7 md:px-10 md:py-6"
    >
      {/*
        Duas linhas, e não uma.

        A pergunta sozinha não dizia o que o botão entrega — quem chega não sabe
        se vai abrir um formulário longo, um mapa de tudo ou uma resposta. A
        segunda linha é a promessa, no vocabulário do produto: o que você
        informa, e o que volta.

        A pergunta subiu de 15px para 17px no celular e 20px no desktop — o piso
        de corpo do produto, e um degrau acima dele onde há largura.

        O tracking desceu de 0.16em para `widest` na mesma passada, e não é
        contradição: caixa alta muito espaçada é o vocabulário do RÓTULO DE
        INSTRUMENTO, e num texto que cresceu ela custava largura numa tela de
        390px sem comprar leitura nenhuma.
      */}
      <span className="flex flex-col gap-1 text-left">
        <span
          className="text-body font-bold tracking-widest text-accent uppercase
                     md:text-title"
        >
          Para onde vamos hoje?
        </span>
        <span className="text-small leading-snug text-ink-muted normal-case">
          Tempo, distância e o destino que cabe
        </span>
      </span>

      <span aria-hidden className="text-title leading-none text-accent">
        →
      </span>
    </Link>
  )
}
