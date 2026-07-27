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

- **Contraste de `--color-ink-faint` (`#5e6b66`) sobre `--color-base`
  (`#101413`).** É o par de cor mais frágil da paleta. `--color-ink-faint` é
  usado em `.instrument-label`, em `Chip` inativo, em texto terciário — meça
  a razão de contraste real antes de aprovar qualquer novo uso em texto que
  carregue informação (não apenas decorativo).
- **Legibilidade dos rótulos sobre o mapa.** O fundo por trás de um label do
  MapLibre (`places-label`, `road-label`, `place-label`) varia com o que
  está sob ele — água, mata, relevo sombreado — mesmo com halo aplicado
  (`text-halo-color`/`text-halo-width`). Não há garantia estática de
  contraste ali, porque o fundo é gerado dinamicamente pelo estilo do mapa.
- **Tamanho de alvo dos pins em toque.** As camadas de pin
  (`src/lib/map/layers.ts`) têm raio pensado para precisão de mouse
  (`circle-radius` interpolado de 3.5px a 6.5px conforme o zoom) — não há
  ajuste de área de toque maior para dedo em tela sensível ao toque.
- **Ausência de anúncio para leitores de tela quando a contagem de
  resultados muda após filtrar.** `StatusBar` atualiza o texto visível
  (`{count} lugares`) a cada mudança de filtro, mas não há `aria-live` nem
  qualquer anúncio equivalente — quem usa leitor de tela não é avisado de
  que o recorte mudou.
- **Os pins do mapa são desenhados em WebGL e portanto não são alcançáveis
  por teclado nem expostos à árvore de acessibilidade.** `PlacesLayer`
  desenha camadas `circle`/`symbol` do MapLibre sobre um `<canvas>`; não
  existe nenhum nó de DOM por pin, então não há como tabular até um lugar,
  não há papel ARIA, e um leitor de tela não sabe que ali existem pontos
  selecionáveis. Isso não é um detalhe de implementação a ajustar — é uma
  lacuna estrutural do MapLibre com canvas/WebGL. **A mitigação natural é
  uma lista textual dos lugares visíveis, navegável por teclado e lida por
  leitor de tela, equivalente em conteúdo aos pins — e ela ainda não
  existe.** Qualquer auditoria de acessibilidade deste produto deve
  assinalar essa ausência explicitamente, não presumir que o mapa por si só
  cobre o requisito de acesso a teclado.
