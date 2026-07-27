# Auditoria de design — Rastro

**Data:** 2026-07-27
**Escopo:** `/`, `/descobrir`, `/viagens`, `/memorias`, shell (`TopBar`, `StatusBar`, `OverlayPanel`), primitivos (`Button`, `Chip`, `Toggle`, `Stat`), camadas de mapa.
**Método:** leitura do código-fonte + inspeção visual real via Playwright em `localhost:3100`, 1512×945 e 390×844, com medição de contraste, tamanho de alvo, ordem de foco e varredura de regras de transição/keyframe no CSS entregue.
**Entrega:** lista de achados priorizada. Nenhum código foi escrito.

Briefings lidos antes da auditoria: `docs/skills/impeccable.md`, `docs/skills/frontend-design.md`, `docs/skills/web-design-guidelines.md`, `docs/DESIGN-SYSTEM.md`, `CLAUDE.md`. Skills invocadas: `impeccable` (registro *product*, referências `critique`/`audit`/`animate`), `frontend-design`, `ui-ux-pro-max`.

---

## 1. Veredito honesto

**Isto não parece template. Parece um instrumento — parado.**

Vou ser específico sobre o que já está bom, porque é a maior parte, e não vou inventar problema para parecer completo.

### O que já está genuinamente autoral

**O estilo cartográfico é o ativo mais forte do produto e não deve ser tocado.** Relevo sombreado legível, terra num verde-carvão frio, oceano quase preto, e — a decisão realmente boa — estradas em osso como o elemento de maior contraste da base, acima de rótulos e limites. Não é Mapbox Dark, não é Carto Dark Matter, não é nenhum preset. Uma carta topográfica noturna de verdade prioriza a via; esta prioriza a via. O tratamento dos rótulos (caixa alta, tracking largo, halo) carrega o caráter sem depender da família de fonte, exatamente como o `DESIGN-SYSTEM.md` argumenta.

**As regras de forma estão sustentadas sem exceção.** Varri a interface inteira: zero card, zero sombra difusa, zero gradiente, zero glassmorphism decorativo, zero ícone ornamental, raio de 2px respeitado em todo controle. O `backdrop-blur-sm` aparece só onde há mapa por trás (`TopBar`, `OverlayPanel`) — é legibilidade, não efeito. Isso é raro e é resultado de disciplina, não de sorte.

**A `StatusBar` é, de fato, o elemento de assinatura.** 28px, mono de 10px, coordenada viva, zoom, contagem, origem. É o que faz a leitura "instrumento" fechar. Sem ela isto seria um mapa escuro bonito; com ela é um painel.

**A cópia é honesta e específica.** "Não substituem um roteador." "Escolher outra origem entra numa próxima etapa." "Nenhum destino cabe nesses limites." Nenhum "Ops!", nenhuma voz de marketing, nenhum estado vazio genérico. Isso é o oposto de AI slop e vale dizer em voz alta.

**O âmbar está sob controle.** Usado em ação primária, estado ativo e anel de foco. 8.82:1 sobre `base`. Não vaza para a base do mapa. O contraste com o cinza-verde de tudo o mais é o que dá a leitura automotiva.

### Onde ele falha em ser premium

**Não é estética. É comportamento.** Este produto está muito bem vestido e completamente inerte.

Medi: o CSS entregue contém **dez** regras que mencionam `transition`, `animation` ou `@keyframes` — e as que não vêm do MapLibre são o preâmbulo de tema do Tailwind. A totalidade do movimento próprio do produto é `transition-colors` em `Button`, `Chip`, links da `TopBar`, o `×` do painel e as linhas de resultado. Não existe entrada de painel, não existe saída de painel, não existe `@keyframes`, não existe bloco `prefers-reduced-motion`.

E o mais grave: **o mapa nunca responde a nada.** Clicar num pin não move a câmera. Filtrar não move a câmera. Rodar uma descoberta que produz seis destinos não move a câmera — o enquadramento fica idêntico ao inicial, e a resposta à pergunta "para onde vamos?" é entregue como uma lista de texto enquanto o mapa, que é a tese inteira do produto, fica olhando. Um instrumento responde. Este não responde.

Somado a isso: dois vazios estruturais grandes (≈390px no rodapé da `FilterRail`, ≈180px no meio do `PlacePanel`) fazem os painéis lerem como inacabados em vez de esparsos, e a faixa de foto do `PlacePanel` é uma laje cinza de 160px que ocupa o topo do painel para não dizer nada.

### O "AI slop" que o dono teme

Praticamente não está aqui. Encontrei três resquícios genuínos, e só três:

1. **`PlaceActions` (`src/components/explore/PlaceActions.tsx:18-30`)** — grade 2×2 de quatro botões desabilitados de peso idêntico. Esse é literalmente o padrão "grade de cards/botões iguais repetidos" que a própria skill lista como banido. É o único lugar da interface que parece andaime.
2. **A faixa de foto vazia (`PlacePanel.tsx:59-74`)** — lê como placeholder de imagem quebrada ou skeleton que nunca resolve.
3. **Os dois disclaimers a 10px `ink-faint`** (`PlacePanel.tsx:114-118`, `DiscoveryResults.tsx:67-70`) — o reflexo "letra miúda no rodapé", aplicado duas vezes, num produto cujo diferencial é justamente ser honesto sobre estimativa.

Fora isso, não há slop. Não invente mais.

**Veredito em uma frase:** premium e intencional em repouso; inerte e inacabado em movimento — e a lacuna a fechar não é de estilo, é de comportamento.

---

## 2. Plano de movimento

Regra de aceitação usada aqui: **movimento que não ajuda a compreender é decoração e foi rejeitado.** Cada item declara o que o usuário deixa de entender sem ele.

### Tokens de movimento (pré-requisito de tudo)

Hoje toda transição usa o default do Tailwind (150ms, `ease`). Não há ritmo comum. Definir em `@theme` de `src/app/globals.css`:

```
--dur-instant: 90ms     /* press, feedback tátil */
--dur-fast:   140ms     /* hover, cor */
--dur-base:   220ms     /* entrada de painel, revelação */
--dur-slow:   320ms     /* mudança de camada de dados */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1)
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1)
--ease-in:        cubic-bezier(0.4, 0, 1, 1)
```

Sem bounce, sem elastic. Saída sempre ~70% da entrada.

---

### A. Câmera responde à seleção — **P1, maior valor do plano**

| | |
|---|---|
| **Elemento** | Câmera do MapLibre |
| **Gatilho** | `slug` muda em `useSelectedPlace` (`src/components/explore/use-selected-place.ts:15`), consumido em `PlacesLayer.tsx:55-62` |
| **Propriedade** | `map.easeTo({ center, padding: { right: 380 }, duration })` no clique em pin (só pan, sem mudar zoom); `map.flyTo({ center, zoom: max(atual, 10), padding })` no clique em item de `DiscoveryResults` |
| **Duração / easing** | 600ms pan, 900ms fly. `easing: t => 1 - Math.pow(1 - t, 4)` (ease-out-quart) |
| **Por que ajuda** | Duas falhas concretas hoje. (1) Clicar num destino na lista de resultados abre o painel e deixa o usuário caçando qual dos pins é aquele — o produto sabe onde é e não conta. (2) O `PlacePanel` de 380px cobre a faixa direita do mapa, e o pin recém-selecionado pode terminar **embaixo do painel**; o `padding: { right: 380 }` resolve isso de graça e é a razão técnica de o movimento ser obrigatório, não estético. Isto é navegação, não enfeite. |

**Não** passar `essential: true` nessas chamadas — ver estratégia de movimento reduzido.

---

### B. Entrada e saída de painel — **P1**

| | |
|---|---|
| **Elemento** | `OverlayPanel` (`src/components/layout/OverlayPanel.tsx:22-34`), aplicado a `PlacePanel` e `DiscoveryResults` |
| **Gatilho** | Montagem / desmontagem |
| **Propriedade** | `transform: translateX(±12px) → 0` + `opacity 0 → 1`. Nunca `width`, nunca `left` |
| **Duração / easing** | Entrada 220ms `--ease-out-quint`; saída 160ms `--ease-in` |
| **Por que ajuda** | O painel hoje aparece e some entre um frame e outro, ocupando 380px de mapa instantaneamente. Uma entrada direcional curta comunica **de onde ele veio** e que o mapa continua atrás, não foi substituído. A saída importa ainda mais: sem ela o painel pisca para fora e o usuário não sabe se fechou, se navegou, ou se algo quebrou. |

**Deslocamento pequeno de propósito (12px, não a largura toda).** Um slide completo desde fora da tela leria como gaveta de app mobile e puxaria o olho para longe do mapa — que é o oposto do que o `OverlayPanel` existe para fazer.

**Nota de implementação:** React desmonta na hora; a saída exige ou uma flag `closing` em estado, ou `element.animate().finished.then(unmount)`, ou `@starting-style` + `transition-behavior: allow-discrete` em CSS puro. Qualquer das três resolve — nenhuma exige biblioteca.

---

### C. Feedback de seleção do pin — **P1**

| | |
|---|---|
| **Elemento** | Camada `PLACE_LAYERS.selected` (`src/lib/map/layers.ts:130-142`) |
| **Gatilho** | `slug` muda |
| **Propriedade** | `circle-radius` e `circle-stroke-opacity`, animados pelo próprio MapLibre via `circle-radius-transition: { duration: 240, delay: 0 }` no `paint` da camada |
| **Duração / easing** | 240ms, curva interna do MapLibre |
| **Por que ajuda** | O anel hoje nasce já no tamanho final. Com 14 pins e vários agrupados perto de Florianópolis em zoom 8, um anel que simplesmente aparece é ambíguo — o olho não sabe qual pin ganhou o anel. Um anel que **cresce a partir do miolo** amarra visualmente o anel ao pin e elimina a ambiguidade. |

**Rejeitado explicitamente:** pulso em loop no pin selecionado. Um elemento pulsando permanentemente sobre um mapa que precisa ser lido é decoração, compete com o relevo e cansa. Cresce, assenta, para.

---

### D. Mudança do recorte de filtro — **P1, segundo maior valor**

| | |
|---|---|
| **Elemento** | Camadas de círculo de `places` |
| **Gatilho** | `visible` muda em `ExploreView.tsx:24-27` |
| **Propriedade** | `circle-opacity` / `circle-stroke-opacity` com `-transition` nativa do MapLibre |
| **Duração / easing** | 180ms para sair, 220ms para entrar |
| **Por que ajuda** | **Isto é cegueira à mudança, e é o problema mais concreto do produto.** Marcar "Cachoeira" faz 13 dos 14 pins desaparecerem em um frame. O usuário não tem como saber se removeu muito, removeu pouco, ou se o mapa quebrou — a única confirmação é `0 / 14` em 10px no rodapé da coluna. Um fade preserva a relação antes/depois e torna o **tamanho** da mudança legível. Aqui o movimento carrega informação que hoje se perde por completo. |

**Nota de implementação decisiva:** hoje `buildPlacesGeoJson(places)` recebe já a lista filtrada (`PlacesLayer.tsx:48-52`), e o MapLibre **não consegue interpolar feature que deixou de existir**. Para que isto funcione é preciso alimentar a fonte com **todos** os lugares e uma propriedade booleana `matched`, e dirigir a opacidade por expressão `case` sobre `matched`. Isso é mudança de arquitetura de dados da camada, não um ajuste de CSS — quem implementar precisa saber disso de antemão.

---

### E. Mudança da contagem de resultados — **P2**

| | |
|---|---|
| **Elemento** | Contagem da `StatusBar` (`StatusBar.tsx:26-30`) e `{resultCount} / {totalCount}` da `FilterRail` (`FilterRail.tsx:116-118`) |
| **Gatilho** | O número muda |
| **Propriedade** | `@keyframes` de `background-color`: âmbar a 12% → transparente, no `span` que contém o valor. Retrigger via `key={count}` |
| **Duração / easing** | 400ms, `ease-out` |
| **Por que ajuda** | A contagem tem 10px e mora num canto de uma tela de 945px. Sem sinal de mudança o usuário nunca percebe que ela atualizou — e é exatamente por isso que filtrar hoje "não parece ter feito nada". Um realce breve é o que um instrumento faz quando um valor muda. |

**Rejeitado:** tween dos dígitos (contagem subindo de 14 até 3). Isso é decoração; a informação é o valor final, não o trajeto. Emparelhar com `aria-live` — ver seção 5.

---

### F. Resultados da descoberta aparecendo — **P2**, com F2 em **P1**

**F1 — a lista**

| | |
|---|---|
| **Elemento** | `<li>` de `DiscoveryResults` (`DiscoveryResults.tsx:35-63`) |
| **Gatilho** | `submitted` é definido em `DiscoveryView.tsx:45` |
| **Propriedade** | `opacity 0→1` + `translateY(6px)→0`, `animation-delay: calc(var(--i) * 35ms)` com `style={{'--i': Math.min(i, 8)}}` |
| **Duração / easing** | 200ms por item, `--ease-out-quint`. Stagger travado em 8 itens → nunca passa de 280ms no total |
| **Por que ajuda** | A lista é a **resposta** a uma pergunta que o usuário acabou de fazer apertando um botão. Um stagger de cima para baixo faz a lista ler como resultado produzido em vez de painel que já estava lá, e estabelece a ordem de leitura — o que importa aqui porque a ordenação é do mais distante ao mais próximo e isso não é óbvio. |

**F2 — a câmera (P1)**

| | |
|---|---|
| **Elemento** | Câmera do MapLibre |
| **Gatilho** | Mesmo submit |
| **Propriedade** | `map.fitBounds(boundsDosResultados, { padding: { left: 272, right: 340, top: 60, bottom: 40 }, duration: 700 })` |
| **Por que ajuda** | **É a mudança de maior valor de todo o fluxo `/descobrir`.** Hoje o usuário responde quatro perguntas, aperta "Encontrar destino", e o mapa fica exatamente igual — os seis destinos ficam espalhados, alguns fora de tela, alguns embaixo dos painéis. O `padding` assimétrico é obrigatório porque as duas colunas comem 612px dos 1512. O mapa deve **recompor para mostrar exatamente o que cabe na viagem**. Sem isto, o produto entrega um mapa que não responde à sua própria pergunta central. |

---

### G. Transição de rota — **P3, o item mais fraco da lista**

| | |
|---|---|
| **Elemento** | Só o contêiner de overlay em `src/app/(app)/layout.tsx:23` |
| **Gatilho** | `pathname` muda |
| **Propriedade** | Crossfade de `opacity`, 120ms |
| **Por que ajuda** | Explorar → Descobrir troca uma coluna de 232px por uma de 272px mais um painel diferente. Um crossfade curto evita a impressão de "dois layouts piscando". |

**O mapa não pode participar disso.** Ele é persistente por ADR 0002; aplicar fade nele contradiz a arquitetura inteira. Se este item custar qualquer coisa, corte — é o único do plano que não sustenta o próprio peso.

---

### H. Hover, foco e press — **P2**

- **Foco:** já é global, âmbar, com offset (`globals.css:46-49`). **Não mexer.** Está certo.
- **`Chip` hover** (`Chip.tsx:16-18`): manter as cores atuais, mas a 140ms com `--ease-out-quart`. **A ativação em si deve ser instantânea** — um filtro é uma chave, não um fade; animar a mudança de estado ativo faria o controle parecer lento.
- **`Button:active`:** `transform: scale(0.98)`, 90ms. Abaixo do limiar de 80–100ms de percepção. Confirma o toque numa superfície onde o resultado pode acontecer fora do campo de visão.
- **Hover de linha em `DiscoveryResults` (`DiscoveryResults.tsx:40-41`):** manter o `hover:bg-overlay`, e **acrescentar o feedback que falta: realçar o pin correspondente no mapa** (camada `places-hover` filtrada pelo slug sob o cursor, com transição de `circle-radius` de 140ms). É o hover mais útil possível neste produto — amarra lista e mapa, que é a costura que o produto inteiro depende e hoje não existe.
- **Rejeitado:** faixa colorida lateral na linha em hover. `border-left` colorido é padrão banido pela skill e pelo projeto.

---

### I. Estados de carregamento e vazio — **P2**

- **Primeira pintura do mapa:** hoje a área central é `--color-void` sólido até os primeiros tiles chegarem, e então o mapa aparece de estalo. Fade de `opacity` de 200ms no contêiner, disparado no evento `load` que já existe em `MapCanvas.tsx:50-54`. O mapa **resolve** em vez de saltar.
- **Skeletons: não.** Os dados são renderizados no servidor e chegam síncronos. Um skeleton aqui seria uma mentira sobre a natureza do carregamento.
- **Estados vazios:** fade de 200ms **com 120ms de atraso**, para que uma consulta rápida que retorna resultados nunca pisque a mensagem de vazio antes.

---

### J. Estratégia `prefers-reduced-motion` — inegociável

**Não usar o `* { animation-duration: 0.01ms !important }` de manual.** Ele mataria também os movimentos de câmera — e a câmera aqui é navegação, não enfeite. Removê-la torna o produto mais difícil de usar, não mais seguro. Três camadas:

**1. Removido por completo sob `reduce`** — translate de painel (B), stagger da lista (F1), scale de press (H), crossfade de rota (G), fade do mapa (I). Viram instantâneos ou só opacidade.

**2. Preservado, retemporizado** — o crossfade de opacidade dos pins na mudança de filtro (D) e o realce da contagem (E). **Estes carregam informação e devem sobreviver.** Mudança de opacidade sem deslocamento é segura para gatilho vestibular; movimento não é. Mantidos, só sem qualquer transform.

**3. Substituído, não removido** — `flyTo` / `easeTo` / `fitBounds` (A, F2). Sob `reduce`, mesma chamada com `duration: 0` — corte seco em vez de viagem. **O MapLibre já honra `prefers-reduced-motion` sozinho nas próprias animações, a menos que se passe `essential: true`.** Portanto: **não passar `essential: true`**. Deixar a biblioteca fazer a coisa certa é a resposta mais barata e mais correta.

**Implementação:** um bloco `@media (prefers-reduced-motion: reduce)` em `globals.css` zerando os tokens `--dur-*` e neutralizando os transforms, mais um hook `useReducedMotion()` de cinco linhas com `matchMedia` para as decisões de câmera em JS. Nenhuma biblioteca envolvida.

---

## 3. Recomendação de biblioteca

**Recomendação única: nenhuma biblioteca. CSS + WAAPI + a própria API do MapLibre.**

### Por que não GSAP

**O argumento decisivo:** dos seis movimentos de maior valor deste plano, **dois vivem dentro do MapLibre e são literalmente inalcançáveis por qualquer biblioteca de animação de DOM.** O crossfade dos pins na filtragem (D) acontece dentro do renderizador WebGL, via propriedades `-transition` da spec de estilo. A câmera (A, F2) é `easeTo`/`flyTo`/`fitBounds`, com curva própria. GSAP não toca em nenhum dos dois. Uma biblioteca de timeline não compra nada exatamente no item que mais importa.

**O resto do plano é trivialmente CSS:**

| Item | Solução nativa | Linhas |
|---|---|---|
| Entrada de painel (B) | `transition` + `@starting-style` | 0 JS |
| Saída de painel (B) | `element.animate().finished.then(unmount)` | ~10 |
| Stagger da lista (F1) | `animation-delay: calc(var(--i) * 35ms)` | 0 JS |
| Hover / press / foco (H) | `transition`, `:active`, `:focus-visible` | 0 JS |
| Realce da contagem (E) | `@keyframes` + `key={count}` | 0 JS |
| Fade do mapa (I) | `transition` na classe do `load` | ~2 |
| Movimento reduzido (J) | `@media` + `matchMedia` | ~5 |

**Custo de bundle:** GSAP core custa ~23KB min+gzip. O `package.json` deste projeto tem **quatro** dependências de produção (`maplibre-gl`, `next`, `react`, `react-dom`). O `CLAUDE.md` declara preferir "~80 linhas de código próprio a um wrapper" e o projeto já recusou deliberadamente `react-map-gl`, bibliotecas de estado e de data. Adicionar 23KB para fazer o que `animation-delay` faz seria incoerente com uma política que já custou trabalho para sustentar.

**Os pontos fortes reais de GSAP mapeiam para zero requisitos aqui:** timelines ligadas a scroll (a página não rola — `h-screen overflow-hidden`), morphing de SVG (não há SVG), motion path (não há), sequenciamento coreografado longo (o registro *product* proíbe: 150–250ms, usuário está numa tarefa, sem coreografia de carregamento).

### O que instalar em vez disso

Nada. Acrescentar ~40 linhas próprias:

1. `src/lib/motion/use-reduced-motion.ts` — hook `matchMedia`, ~12 linhas.
2. `src/lib/motion/use-exit-transition.ts` — mantém o nó montado pela duração da saída, ~20 linhas.
3. Quatro tokens de duração e três de easing em `@theme`.

### Quando revisitar

Se `/viagens` um dia precisar animar o traçado gravado de uma viagem ao longo da rota com controle de scrub, revisitar. E mesmo aí a resposta idiomática é `setPaintProperty` sobre um `line-gradient` dirigido por `requestAnimationFrame` — de novo dentro do MapLibre, de novo fora do alcance de GSAP.

---

## 4. Achados visuais e de UX

### P1 — dana o produto

---

**P1.1 — `/` não tem estado vazio: o filtro pode esvaziar o mapa em silêncio**
`src/components/explore/ExploreView.tsx:41-49` · `src/components/explore/FilterRail.tsx:115-122`

Verificado em tela: com `?status=visitado&cat=cachoeira` o mapa fica **sem um único pin** e a interface não diz absolutamente nada. Os únicos sinais são `0 / 14` a 10px `ink-faint` no rodapé da coluna e `● 0 lugares` a 10px `ink-faint` na statusbar — 1.512 pixels de largura separando os dois, ambos abaixo do contraste AA.

**Por que importa:** é o caminho de falha mais fácil de atingir do produto inteiro. O usuário marca dois filtros, tudo some, e não há explicação nem caminho de volta além de um botão "Limpar" escondido no rodapé de uma coluna. A `DiscoveryResults` tem estado vazio; a `/` não tem. Essa assimetria é a inconsistência mais cara da interface.

**Correção:** quando `visible.length === 0`, mostrar no vazio da `FilterRail` (ver P2.2) um bloco com a frase do que aconteceu, **qual restrição está eliminando mais lugares** (o domínio já tem os dados para calcular), e um botão de recuperação de um clique — mesma gramática do estado vazio de `DiscoveryResults`, que já está escrito com o tom certo.

---

**P1.2 — a interface é completamente estática**
`src/app/globals.css` (nenhum `@keyframes`, nenhum bloco `prefers-reduced-motion`) · todos os componentes

Dez regras no CSS entregue mencionam transição, e as não-MapLibre são preâmbulo do Tailwind. O movimento próprio do produto é `transition-colors` e nada mais. Painéis aparecem e somem entre frames; pins somem entre frames; o anel de seleção nasce pronto.

**Por que importa:** o dono pediu "bem animada, com movimento e útil". Além disso, a ausência de movimento aqui não é neutra — ela **destrói informação**, porque num mapa com 14 pontos a diferença entre "antes" e "depois" de um filtro só existe no movimento.

**Correção:** seção 2 deste documento na íntegra. Começar por D (crossfade dos pins) e A/F2 (câmera) — carregam sozinhos a maior parte do valor.

---

**P1.3 — o mapa nunca reage a seleção nem a descoberta**
`src/components/map/PlacesLayer.tsx:55-62` · `src/components/explore/DiscoveryView.tsx:37,45`

Nenhuma chamada de câmera existe no código. Verificado em tela: submeter a descoberta com seis resultados deixa o enquadramento idêntico ao inicial; dois dos seis pins ficam visíveis, o resto fica fora de tela ou embaixo dos painéis de 272px e 340px.

**Por que importa:** este é um achado de produto, não de polimento. O `CLAUDE.md` diz que "o mapa é a memória visual da vida do motociclista" e que o Rastro responde "para onde eu vou?". O usuário faz literalmente essa pergunta apertando "Encontrar destino" — e o mapa não responde. A resposta chega como lista de texto, que é o formato que o produto existe para não ser.

**Correção:** itens A e F2 da seção 2. `fitBounds` sobre o conjunto de resultados com `padding` assimétrico pelas larguras dos painéis; `easeTo` com `padding.right` na seleção de pin.

---

**P1.4 — `--color-ink-faint` falha WCAG AA e carrega informação real em todo o produto**
`src/app/globals.css:18` e `:60-66` · `StatusBar.tsx:17-33` · `FilterRail.tsx:116` · `Chip.tsx:17` · `PlacePanel.tsx:88,105-118` · `DiscoveryResults.tsx:50-70`

Medido: `#5e6b66` sobre `#101413` = **3.33:1**. Sobre `#171c1a` (a faixa de foto) = **3.10:1**. Mínimo AA para texto normal: 4.5:1. E o uso é a **10px**, portanto texto normal sem discussão.

O que fica ilegível: todos os `.instrument-label`, a `StatusBar` inteira, a contagem `0 / 14`, os dois disclaimers, as tags do lugar, os rótulos de chip inativo, a categoria e o tempo de cada resultado de descoberta.

**Por que importa:** `docs/skills/web-design-guidelines.md` já sinalizava este par como o mais frágil da paleta e pedia medição antes de aprovar novo uso em texto que carrega informação. Foi medido: falha. E não é texto decorativo — é a statusbar, que é o elemento de assinatura do produto.

**Correção:** subir `--color-ink-faint` para algo em torno de `#7b8884` (≈4.6:1 sobre `base`) e reservar o tom atual só para separadores e glifos não informativos. É um ajuste de um token; a leitura de instrumento não se apoia no quão apagado o texto está, e sim no mono, no tracking e na caixa alta — que continuam intactos.

---

**P1.5 — o chrome do MapLibre desenha por cima dos painéis da aplicação**
`src/components/layout/OverlayPanel.tsx:22-34` (sem `z-index`) · CSS do `maplibre-gl`

Medido: `.maplibregl-ctrl-bottom-right` é `position: absolute; z-index: 2`; o `<aside>` do `OverlayPanel` é `position: absolute; z-index: auto`. Resultado visível: a pílula de atribuição, **fundo branco puro `rgb(255,255,255)`**, desenha sobre o `PlacePanel` e sobre a `DiscoveryResults`, cobrindo o disclaimer dos dois.

**Por que importa:** duas falhas de uma vez. É um retângulo branco de alto contraste numa interface deliberadamente escura — o único elemento da tela que não pertence ao sistema visual — e ainda por cima oculta texto próprio da aplicação. É o detalhe que faz a leitura "premium" desmoronar num screenshot.

**Correção:** escala de `z-index` semântica (mapa 0 → chrome do mapa 10 → painéis 20 → barras 30), e estilizar `.maplibregl-ctrl-attrib` para a gramática do produto: fundo `--color-base`, texto `--color-ink-faint` corrigido, sem raio, hairline. A atribuição é obrigação de licença e deve continuar legível — o problema é o estilo default, não a presença dela.

---

**P1.6 — a interface quebra estruturalmente abaixo de ~800px**
`src/components/layout/OverlayPanel.tsx:24` (largura em px literais) · `TopBar.tsx:24` · `StatusBar.tsx:14`

Capturado a 390×844: a `FilterRail` ocupa 232 dos 390px (60% da tela), sobrando 158px de mapa; o nav da `TopBar` corta em "Memórias"; o CTA quebra em duas linhas e é coberto pela atribuição; a `StatusBar` quebra em duas linhas e estoura a altura fixa de 28px.

**Por que importa:** o produto é sobre viajar de moto. Ainda que o planejamento aconteça na mesa, "onde eu já estive" e "o que ainda quero conhecer" são perguntas que se fazem parado no acostamento.

**Correção:** `OverlayPanel` com largura em `min()` / `clamp()` em vez de px literais; `FilterRail` vira folha inferior abaixo de um breakpoint; nav da `TopBar` colapsa; `StatusBar` reduz para coordenada + contagem.

**Honestidade sobre esta prioridade:** `docs/skills/impeccable.md` já lista o comportamento em telas menores como ponto aberto. Este é o único P1 que se pode adiar sem culpa **se** o dono confirmar que o produto é desktop-only por decisão. Se não confirmar, é P1.

---

### P2 — melhoria clara

---

**P2.1 — a faixa de foto é uma laje cinza de 160px que não diz nada**
`src/components/explore/PlacePanel.tsx:59-74`

Sem `coverImageUrl`, o elemento **maior e mais alto** do painel é um bloco `bg-raised` de 160px com "12 FOTOGRAFIAS" em 10px centralizado, a 3.10:1. Lê como imagem quebrada.

**Por que importa:** ocupa o espaço mais valioso do painel para inverter a hierarquia — o nome, a distância e o status do lugar ficam empurrados para baixo por um vazio. O comentário no código diz que o espaço é assumido porque "fotografia é conteúdo central deste produto"; o efeito atual é o oposto, porque comunica ausência com o maior elemento da tela.

**Correção:** quando não há foto, reduzir a faixa para ~48px com o texto alinhado à esquerda no mesmo padding do restante, ou suprimir e mover a contagem de fotos para a linha de status ao lado de `VisitStatusBadge`. Reservar os 160px só para quando **existe** imagem.

---

**P2.2 — três vazios grandes fazem os painéis lerem como inacabados**
`FilterRail.tsx:47-113` (≈390px vazios) · `PlacePanel.tsx:94-118` (≈180px) · `DiscoveryResults.tsx:34-65` (até ≈600px com poucos resultados)

O conteúdo da `FilterRail` termina a 40% da altura da coluna; o resto é `bg-base` liso até o rodapé.

**Por que importa:** esparso é uma decisão; vazio é uma omissão, e a diferença se lê na hora. Numa interface que se apoia em densidade de instrumento, um terço de coluna em branco lê como tela não terminada.

**Correção — e esta é a melhor recomendação estrutural desta auditoria:** preencher o vazio da `FilterRail` com a **lista textual dos lugares visíveis**, navegável por teclado. Um componente resolve quatro problemas de uma vez: o vazio (P2.2), o estado vazio de `/` (P1.1), a lacuna de acessibilidade dos pins WebGL (seção 5) e a costura lista↔mapa que hoje não existe (item H da seção 2). É o melhor retorno por unidade de trabalho no documento inteiro.

---

**P2.3 — quatro botões desabilitados idênticos: o único cheiro real de template**
`src/components/explore/PlaceActions.tsx:18-30`

Grade 2×2 de quatro botões de peso visual idêntico, todos inertes, acima da única ação que funciona.

**Por que importa:** manter ações não implementadas visíveis é decisão registrada e eu não a estou contestando — mas **quatro controles mortos de peso igual** é exatamente o padrão de grade repetida que o projeto lista como banido, e além disso os rótulos a 40% de opacidade medem **3.42:1**, o que contradiz o próprio `DESIGN-SYSTEM.md:166-168` ("mantém o rótulo legível").

**Correção:** manter as quatro presentes, mas rebaixá-las a uma linha só de peso terciário sob uma `.instrument-label` explícita ("Em breve"), com "Abrir rota" promovida ao topo do bloco. E subir a opacidade de `disabled` de 40% para ~55%, o que devolve legibilidade sem sugerir que estão ativas.

---

**P2.4 — nenhum anúncio quando o número de resultados muda**
`src/components/layout/StatusBar.tsx:26-30` · `FilterRail.tsx:116-118`

Nenhum `aria-live`, nenhum `role="status"`.

**Por que importa:** quem usa leitor de tela marca um chip e não recebe nenhuma informação de que o recorte mudou. Como os pins são WebGL e invisíveis à árvore de acessibilidade, a contagem é literalmente **a única** representação acessível do resultado do filtro — e ela é silenciosa.

**Correção:** `role="status" aria-live="polite" aria-atomic="true"` no `span` da contagem, com texto completo ("3 lugares de 14 visíveis").

---

**P2.5 — `/descobrir` perde a contagem da statusbar**
`src/components/explore/DiscoveryView.tsx` (nunca chama `useSetVisiblePlaceCount`, ao contrário de `ExploreView.tsx:29-32`)

Verificado em tela: em `/` a statusbar mostra `● 14 lugares`; em `/descobrir` esse campo simplesmente some, mesmo depois de a busca reduzir o mapa a seis pontos.

**Por que importa:** um instrumento cujo mostrador desaparece ao trocar de modo não é confiável. E é justamente na descoberta que a contagem tem mais significado.

**Correção:** `DiscoveryView` publica `visible.length` no mesmo contexto.

---

**P2.6 — alvos de interação muito pequenos**
`Chip.tsx:13` (56×24 medido) · `Toggle.tsx:14` (12×12 medido) · `PlacePanel.tsx:45-53` (≈14×18)

**Por que importa:** 24px de altura é pequeno até para mouse e inviável para toque; um checkbox de 12px é metade do padrão nativo; e o `×` do painel é o alvo mais difícil da interface sendo a única saída dele.

**Correção:** manter a **caixa visual** do `Chip` em 24px (a densidade é parte da linguagem) e expandir só a área clicável com padding vertical transparente até 32px. `Toggle`: caixa de 14px com a `<label>` inteira contando como alvo (já conta — só falta altura de linha maior). `×`: manter o glifo e levar a área a 32×32.

---

**P2.7 — o âmbar do CTA disputa com o âmbar do dado**
`DiscoveryLauncher.tsx:8-9` · `globals.css:22,27` (`--color-wanted` = `--color-accent`)

O bloco "PARA ONDE VAMOS?" é o maior elemento saturado da tela, e usa exatamente o mesmo tom dos pins de "quero conhecer" que estão logo ao lado no mapa.

**Por que importa:** enfraquece a codificação de dados. Num produto que codifica estado de visita por cor, gastar o mesmo tom num botão de navegação faz o olho tratar o botão como se fosse dado.

**Correção:** manter o âmbar como cor do CTA (é a ação primária e merece), mas dar a ele um tratamento que o separe do vocabulário do mapa — por exemplo `outline` âmbar sobre `--color-base` opaco em vez de preenchimento sólido. A ação continua inequívoca e o preenchimento âmbar volta a significar exclusivamente "quero conhecer".

---

**P2.8 — o CTA principal é a 28ª parada de tabulação**
Medido: 28 `Tab` desde o carregamento até `Para onde vamos?`. Ordem: 5 links da TopBar → canvas → 3 links de atribuição → 9 chips de categoria → 4 chips de raio → 4 checkboxes → CTA.

**Por que importa:** a ação primária da tela inicial fica atrás de dezenove controles de refinamento. Quem navega por teclado atravessa a interface inteira antes de chegar ao que a tela existe para oferecer.

**Correção:** não mexer em `tabindex` (isso quebra mais do que conserta). Reordenar o **DOM**: renderizar `DiscoveryLauncher` antes de `FilterRail` em `ExploreView.tsx:42-50` e posicionar por CSS. A ordem visual não muda; a de foco melhora dezenove posições.

---

**P2.9 — o estado vazio da descoberta não oferece recuperação**
`src/components/explore/DiscoveryResults.tsx:24-32`

"Aumente a distância, o tempo disponível, ou remova alguma categoria." — três saídas nomeadas, zero acionáveis.

**Por que importa:** o sistema **sabe** qual restrição eliminou o quê, porque foi ele que filtrou (`discovery.ts:80-100`). Devolver isso como prosa transfere ao usuário um trabalho que a máquina já fez.

**Correção:** um botão de recuperação de um clique com o próximo limite que produziria resultado ("Ampliar para 100 km — 3 destinos"). O texto atual é bom; falta a ação.

---

**P2.10 — nenhuma página tem `h1` em repouso**
`(app)/page.tsx`, `descobrir/page.tsx`, `viagens/page.tsx`, `memorias/page.tsx` · o único `<h1>` do produto está em `PlacePanel.tsx:37`

O documento não tem cabeçalho nenhum até que um painel de lugar abra — e aí ganha um `h1` que é o nome de um lugar.

**Por que importa:** navegação por cabeçalhos é o principal meio de orientação em leitor de tela; aqui não há estrutura para navegar, e o `h1` que existe é contextual e volátil.

**Correção:** `h1` visualmente oculto por rota ("Explorar o mapa", "Descobrir destinos"), e o nome do lugar rebaixado a `h2` no painel.

---

### P3 — polimento de gosto

- **CTA opticamente descentralizado** — `DiscoveryLauncher.tsx:7` usa `left-1/2` da viewport; com a coluna de 232px à esquerda, o centro óptico da área de mapa fica ~120px à direita. Centralizar sobre a área de mapa, não sobre a página.
- **Ordenação do mais distante ao mais próximo não é explicada** — a decisão está documentada em `discovery.ts:67-69` e é boa; a lista mostra 73, 58, 46, 35, 27, 19 km sem dizer por quê. Uma linha na `.instrument-label` do cabeçalho ("Do mais distante ao mais próximo") resolve.
- **Glifos da statusbar** — `⌖` `⌂` `●` (`StatusBar.tsx:18,28,32`) dependem de fallback de fonte e renderizam de forma inconsistente. Substituir por rótulos `.instrument-label` curtos (`POS`, `ORIG`) fortalece a leitura de instrumento e remove a dependência.
- **`alt=""` em imagem de conteúdo** — `PlacePanel.tsx:64`. A foto de capa é conteúdo, não ornamento; deveria descrever o lugar.
- **Dois disclaimers a 10px** — `PlacePanel.tsx:114-118` e `DiscoveryResults.tsx:67-70` repetem quase a mesma frase. Unificar num texto só, um passo acima em tamanho e contraste. É a promessa de honestidade do produto; não deveria ser o menor texto da tela.
- **Chips de categoria quebram em linhas irregulares** — `FilterRail.tsx:50-65`, quatro linhas com larguras desiguais. Uma grade de 3 colunas de largura igual leria muito mais como painel de instrumento.
- **`FilterRail` poderia colapsar** — ponto já aberto no briefing. Menos urgente se o vazio for preenchido pela lista de lugares (P2.2).
- **Sem tokens de movimento** — hoje todo `transition-colors` usa o default do Tailwind. Ver seção 2.

---

## 5. Achados de acessibilidade

### Já está certo — não mexer

- `:focus-visible` global, âmbar, com offset, sem exceção declarada (`globals.css:46-49`). Verificado percorrendo 28 paradas de foco: nenhum controle perde o anel.
- `aria-pressed` em `Chip` (`Chip.tsx:11`), `<input type="checkbox">` nativo em `Toggle` (`Toggle.tsx:11-16`), `aria-current="page"` na `TopBar` (`TopBar.tsx:44`), `aria-label="Fechar painel"` no `×` (`PlacePanel.tsx:48`).
- Zero `div` com `onClick` no produto. Verificado.
- `<html lang="pt-BR">` (`app/layout.tsx:17`); `NEXT-ROUTE-ANNOUNCER` presente, cobrindo o anúncio de troca de rota.

Esta é uma base melhor do que a média. Os problemas abaixo são reais mas não são de negligência.

### Contraste — **P1**

Ver P1.4. `ink-faint` a 3.33:1 usado a 10px em texto informativo por todo o produto. Falha AA medida, não estimada.

Complementos medidos: `ink` 15.67:1 ✅ · `ink-muted` 7.30:1 ✅ · `accent` 8.82:1 ✅ · `void` sobre botão âmbar 9.32:1 ✅ · `visited` 8.01:1 ✅ · `unvisited` 5.17:1 ✅ · rótulo de mapa `#c3ccc8` sobre halo 11.95:1 ✅. **Só `ink-faint` falha** — e é o único que importa corrigir.

### Ordem de foco — **P2**

Ver P2.8. Também: o `<canvas>` do mapa recebe foco (parada 6) e não anuncia nada de útil. Dar-lhe `role="application"` com `aria-label`, ou retirá-lo da ordem e apontar para a lista textual.

### Tamanho de alvo — **P2**

Medido: chips 56×24, checkboxes 12×12, `×` do painel ≈14×18, links do nav 91×29. Nenhum atinge 44×44. Ver P2.6 — a correção preserva a densidade visual e expande só a área clicável.

### Leitor de tela — **P2**

Ver P2.4 (sem `aria-live` na contagem) e P2.10 (sem `h1`).

### Os pins WebGL — avaliação e mitigação mínima

**O fato:** `PlacesLayer` (`src/components/map/PlacesLayer.tsx`) desenha camadas `circle`/`symbol` do MapLibre sobre um `<canvas>`. Não existe nó de DOM por lugar. Consequência: não há como tabular até um lugar, não há papel ARIA, nenhum leitor de tela sabe que ali existem pontos selecionáveis. Confirmado por inspeção do DOM renderizado.

**Quanto isso importa, honestamente:** é uma lacuna estrutural do MapLibre com canvas/WebGL, não um descuido do Rastro, e nenhuma configuração da biblioteca a resolve. O produto é de uso pessoal, o que reduz a urgência em termos de alcance — mas **não** reduz a gravidade técnica, porque hoje o produto tem exatamente **zero** caminhos de teclado para a sua ação primária. Selecionar um lugar só é possível com mouse sobre o canvas. Isso não é "acessibilidade imperfeita"; é uma funcionalidade central sem alternativa de teclado.

E há uma razão além da acessibilidade para resolver: **a mitigação natural conserta vários problemas de usuário vidente ao mesmo tempo.**

**Mitigação mínima viável — uma lista textual dos lugares visíveis, e ela deve ser visível, não oculta:**

- Ocupa o vazio de ~390px da `FilterRail` (P2.2).
- Dá a `/` o estado vazio que falta (P1.1).
- Dá à contagem um lugar onde morar, com `aria-live` (P2.4).
- Torna legível "o que está no recorte" quando pins se sobrepõem em zoom baixo — problema real, verificado em tela perto de Florianópolis.
- Vira o parceiro de hover do mapa (item H da seção 2): passar o cursor na linha realça o pin; clicar seleciona e move a câmera.
- Torna o produto navegável só com teclado, ponta a ponta.

Cada item é `<button>` com o nome, a categoria, a distância e o status de visita — equivalente em conteúdo aos três canais visuais do pin, sem reabrir a decisão do ADR 0005 sobre como o pin é desenhado.

**Complementos baratos:** link "pular para a lista de lugares"; `aria-hidden` ou `role="application"` + rótulo no canvas; `role="status"` na contagem.

---

## 6. Explicitamente fora de escopo

### Restrições já decididas — respeitadas, não reabertas

- **Lenis** — fora. O shell é `h-screen overflow-hidden`; sequestrar scroll sobre um mapa seria nocivo.
- **Three.js** — fora. Não há conteúdo 3D; o MapLibre já é WebGL.
- **Os três canais visuais do pin** (ADR 0005), **o mapa persistente no layout** (ADR 0002), **o painel lateral em vez de modal**, **a paleta e os tokens**, **o teto de raio de 2px**, **a regra de hairline em vez de sombra**, **Noto Sans nos rótulos do mapa**, **a ordenação do mais distante ao mais próximo** em `discovery.ts`. Nada disso é questionado aqui. As correções propostas cabem dentro de todas.

### Considerado e rejeitado por mérito

- **GSAP.** Ver seção 3. Duas das seis animações de maior valor vivem dentro do MapLibre e nenhuma biblioteca de DOM as alcança; o resto é CSS de uma linha. 23KB para não resolver o que importa.
- **Framer Motion / `motion`.** Mesmo raciocínio, custo maior.
- **Skeleton loaders nos painéis.** Os dados vêm renderizados no servidor e chegam síncronos. Um skeleton comunicaria uma espera que não existe.
- **Pulso em loop no pin selecionado.** Decoração permanente sobre uma superfície que precisa ser lida. Cresce, assenta, para (item C).
- **Coreografia de carregamento da página.** Registro *product*: o usuário abre isto dentro de uma tarefa; não vai assistir a interface se montar.
- **Qualquer coisa disparada por scroll.** A página não rola.
- **Tween dos dígitos da contagem.** A informação é o valor final, não o trajeto até ele.
- **Parallax, cursor customizado, grão/ruído de fundo.** Atmosfera decorativa sobre um mapa que já tem textura de relevo real. Competiria com o dado.
- **Introduzir um conjunto de ícones.** O produto hoje não tem ícones, e é melhor por isso. "Ícone só quando substitui texto" — nenhum caso aberto justifica.
- **Faixa colorida lateral (`border-left`) nas linhas de resultado.** Padrão banido pela skill e pelo projeto.
- **Aumentar raio, acrescentar sombra ou glassmorphism para dar profundidade aos painéis.** A separação por hairline funciona e está sustentada; a profundidade vem da hierarquia de superfícies (`void`/`base`/`raised`/`overlay`), que já existe e já funciona.
- **Redesenhar o estilo do mapa.** É o ativo mais forte do produto. Deixar em paz.
- **Tooltips só de hover** em qualquer lugar. Sem equivalente de teclado e sem equivalente de toque.
- **Paleta de comandos / atalhos.** Interessante para um usuário avançado, mas é escopo de produto, não de auditoria de design.

### Não é achado — artefato de desenvolvimento

O círculo escuro com "N" no canto inferior esquerdo das capturas é `NEXTJS-PORTAL`, o indicador de dev-tools do Next.js. Não existe em produção. Confirmado por `elementFromPoint`. Registrado aqui para que ninguém "conserte" o que não está quebrado.

---

## Resumo da priorização

| | Contagem | Itens |
|---|---|---|
| **P1** | 6 | Sem estado vazio em `/` · Interface estática · Mapa não reage · `ink-faint` falha AA · Chrome do MapLibre sobre os painéis · Quebra em telas pequenas |
| **P2** | 10 | Faixa de foto · Vazios estruturais · Botões desabilitados · Sem `aria-live` · Contagem some em `/descobrir` · Alvos pequenos · Âmbar duplo · CTA na 28ª tabulação · Vazio sem recuperação · Sem `h1` |
| **P3** | 8 | CTA descentralizado · Ordenação não explicada · Glifos da statusbar · `alt=""` · Disclaimers duplicados · Quebra de chips · Rail colapsável · Tokens de movimento |

**Se só três coisas forem feitas:** (1) `fitBounds` nos resultados da descoberta e `easeTo` na seleção de pin — devolve ao mapa o papel que o produto lhe atribui; (2) a lista textual dos lugares visíveis no vazio da `FilterRail` — conserta o estado vazio, a densidade, a acessibilidade de teclado e a costura lista↔mapa de uma vez; (3) corrigir `--color-ink-faint` — um token, e a statusbar volta a ser legível.
