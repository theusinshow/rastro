# Briefing — `/web-design-guidelines` no Rastro

Cole este arquivo inteiro junto do pedido ao invocar `/web-design-guidelines`
para auditar acessibilidade, foco, contraste ou semântica no Rastro.

## Garantias já assumidas — verifique que continuam verdadeiras

- **`:focus-visible` global âmbar com offset.** `src/app/globals.css`:
  `outline: 1px solid var(--color-accent); outline-offset: 2px` em
  `:focus-visible`, aplicado a todo controle interativo do produto, sem
  exceção declarada.
- **`aria-pressed` nos chips.** `Chip` (`src/components/ui/Chip.tsx`) é um
  `button` real com `aria-pressed={active}`, nunca um `div` com `onClick`.
- **Checkbox nativo no `Toggle`.** `Toggle`
  (`src/components/ui/Toggle.tsx`) usa `<input type="checkbox">` real com
  `appearance-none` + estilo `checked:`, não uma reimplementação em `div`.
- **`aria-current` na navegação.** `TopBar`
  (`src/components/layout/TopBar.tsx`) marca o item ativo com
  `aria-current="page"`.
- **`aria-label` no botão de fechar.** `PlacePanel`
  (`src/components/explore/PlacePanel.tsx`) usa
  `aria-label="Fechar painel"` no `×` que fecha o painel — o glifo sozinho
  não seria lido de forma útil por um leitor de tela.
- **Botão real em vez de `div` clicável**, em todo o produto: `Button`,
  `Chip`, o botão de fechar do `PlacePanel`, os itens de
  `DiscoveryResults`. Nenhum `onClick` está pendurado num elemento sem
  semântica de controle.

## Riscos conhecidos desta interface — checar sempre

- **Contraste de `--color-ink-faint` sobre `--color-base` (`#101413`).**
  Continua sendo o par mais frágil da paleta, embora não falhe mais: o token
  subiu de `#5e6b66` (3.33:1, reprovado) para `#7b8884` (5.04:1 sobre `base`,
  4.68:1 sobre `raised`). Ainda assim, `--color-ink-faint` é usado a 10px em
  `.instrument-label`, na statusbar e em texto terciário — meça a razão real
  antes de aprovar qualquer novo uso em texto que carregue informação.
- **Legibilidade dos rótulos sobre o mapa.** O fundo por trás de um label do
  MapLibre (`places-label`, `road-label`, `place-label`) varia com o que
  está sob ele — água, mata, relevo sombreado — mesmo com halo aplicado
  (`text-halo-color`/`text-halo-width`). Não há garantia estática de
  contraste ali, porque o fundo é gerado dinamicamente pelo estilo do mapa.
- **Tamanho de alvo dos pins em toque.** As camadas de pin
  (`src/lib/map/layers.ts`) têm raio pensado para precisão de mouse
  (`circle-radius` interpolado de 3.5px a 6.5px conforme o zoom) — não há
  ajuste de área de toque maior para dedo em tela sensível ao toque.
- **Anúncio da contagem de resultados.** Resolvido: `PlaceList`
  (`src/components/explore/PlaceList.tsx`) mantém um `role="status"`
  `aria-live="polite"` `aria-atomic="true"` com a frase completa
  ("3 lugares de 14 no recorte"). A `StatusBar` continua sem `aria-live` de
  propósito — duas regiões vivas anunciando o mesmo número seria ruído.
- **Os pins do mapa são desenhados em WebGL e portanto não são alcançáveis
  por teclado nem expostos à árvore de acessibilidade.** `PlacesLayer`
  desenha camadas `circle`/`symbol` do MapLibre sobre um `<canvas>`; não
  existe nenhum nó de DOM por pin, então não há como tabular até um lugar,
  não há papel ARIA, e um leitor de tela não sabe que ali existem pontos
  selecionáveis. Isso não é um detalhe de implementação a ajustar — é uma
  lacuna estrutural do MapLibre com canvas/WebGL. **A mitigação existe desde
  a Tarefa 14: `PlaceList` (`src/components/explore/PlaceList.tsx`) é a lista
  textual dos lugares no recorte, navegável por teclado, com nome, categoria,
  distância e situação de visita — equivalente em conteúdo aos três canais
  visuais do pin.** Ela também é o parceiro de hover do mapa: passar o cursor
  ou o foco numa linha realça o pin correspondente. Qualquer trabalho futuro
  em pins deve manter essa lista em dia, porque ela é o único caminho de
  teclado até a ação primária do produto.
