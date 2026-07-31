# Prompt — refazer o design system do Rastro

Documento para ser entregue inteiro a quem (pessoa ou modelo) vai propor a nova
direção visual.

**A encomenda é uma direção visual nova, completa, com liberdade real.** Cor,
tipografia, forma, movimento, transformação de ícone, o acabamento de um
aplicativo de primeira linha. O que segue é contexto e inventário para você não
desenhar no escuro — não é uma cerca. O que fica de pé está no §2, cabe em meia
página, e está lá porque é o produto, não porque é regra.

Escrito em 2026-07-31, contra o estado real do repositório nessa data.

---

## 1. O produto

**Rastro** é o mapa da vida de um motociclista. Um produto pessoal, de um dono
só por enquanto, feito para Santa Catarina.

> O Google Maps responde *"como chego lá?"*.
> O Rastro responde *"para onde eu vou?"*, *"onde eu já estive?"*,
> *"o que ainda quero conhecer?"* e *"quais histórias ficaram dessas viagens?"*.
>
> O mapa é a memória visual da vida do motociclista.

O que ele faz hoje, em cinco telas: **Explorar** (mapa com pins, filtros, busca,
painel do lugar), **Descobrir** (propõe destinos por tempo disponível e
distância), **Viagens** (monta roteiro, mede a estrada de verdade, mostra
altimetria, previsão de neblina, paradas de combustível), **Memórias** (linha do
tempo por mês, balanço do ano) e **Perfil** (origem, autonomia da moto).

### O contexto de uso é hostil, e é ele que manda

Este produto é consultado **parado no acostamento, com luva, sol na tela**, por
alguém que não tem vinte anos. Isso já derrubou uma direção visual inteira: o
texto de instrumento a 10px e os alvos de toque de 24px foram reprovados numa
auditoria e viraram piso de corpo de 17px e rótulo de 12px.

Qualquer proposta que só funcione num monitor calibrado em ambiente controlado
está errada, por mais bonita que seja.

### O princípio que atravessa tudo

**O produto não apresenta como medido aquilo que não mediu.** Distância estimada
diz que é estimada. Previsão diz que é previsão. Piso do acesso em branco
significa "não sei", nunca "asfalto". Subida acumulada foi deliberadamente
deixada de fora porque o dado não a sustenta.

Isso tem consequência visual direta: **existe uma hierarquia entre número medido,
número estimado e opinião**, e ela precisa ser legível sem ler a legenda. Hoje
isso é resolvido com separação por hairline e com a palavra escrita. O redesign
pode resolver melhor — não pode apagar.

---

## 2. O que fica de pé

Curto de propósito. Tudo que não está aqui está aberto.

1. **A marca.** Um R cuja perna é a estrada, com faixa central tracejada
   desenhada na cor do fundo (asfalto cortado, não linha por cima). Geometria em
   `src/components/ui/Logo.tsx`, duplicada em `src/app/icon.svg`. Compensação
   óptica de traço por tamanho: 15 / 14 / 13 / 12 conforme a marca encolhe. A
   faixa some abaixo de 32px. **O tratamento dela — placa, escala, onde aparece,
   como se comporta em movimento — é livre.**
2. **A família de cor.** Couro escurecido nas superfícies, areia no texto, âmbar
   queimado de instrumento no acento, oliva em "visitado". **Reafine à vontade:
   valores, número de degraus, temperatura.** O que não vira outra coisa é a
   família — nada de azul de SaaS. Se quiser propor paletas vizinhas dentro do
   mesmo assunto (couro, instrumento de painel, farol, mapa náutico, sinalização
   rodoviária), proponha em variantes e diga o que cada uma ganha.
3. **O mapa é estrutura, não conteúdo dentro de uma caixa.** Ele sangra sob todo
   o cromo ([ADR 0010]). O cromo por cima dele é livre.
4. **Contraste medido, não estimado.** Todo par novo entra com a razão medida
   sobre a superfície. Piso: AA para texto normal. Isto não é preferência
   estética, é o §1.
5. **`prefers-reduced-motion` respeitado** — mas a política de três camadas (§6)
   é uma implementação, não um dogma. Se tiver política melhor, proponha.

---

## 3. Você tem liberdade — leia isto e depois proponha o que quiser

O dono pediu explicitamente **cards, animações, motion, icon morphism e o
acabamento de um aplicativo de primeira linha**, e disse, com estas palavras:
*"quero dar liberdade pro Claude design trabalhar"*.

Então: **a lista abaixo não é uma lista de proibições que você precisa contestar.
É o registro do que já foi tentado e por quê.** Ela existe para você não gastar
esforço redescobrindo um argumento que já foi feito — e para você poder discordar
com conhecimento de causa, que é uma discordância muito melhor.

Proponha o que achar certo. Onde a proposta contrariar um destes pontos, **basta
dizer que contraria e por quê** — o ADR que substitui o anterior é escrito depois,
por quem implementa. Não peça licença.

| Hoje o produto evita | Porque, na época | O que mudou desde então |
|---|---|---|
| **Card com conteúdo primário** | Card empurra o mapa para dentro de uma caixa, e o mapa é o produto | O produto ganhou telas que não são o mapa: Viagens, Memórias, o balanço do ano. A regra nasceu quando só existia o mapa |
| **Ícone fora da navegação** | Glifo sem rótulo vira adivinhação com luva e sol na tela | O argumento vale para ícone **sozinho**. Ícone com rótulo, ou ícone que se transforma para mostrar mudança de estado, nunca foi testado aqui |
| **Gradiente** | Achata a leitura e é a assinatura do template genérico | — |
| **Glassmorphism** | Blur só onde há mapa atrás, e por legibilidade | O mapa atrás é a maior parte do produto, então a exceção é quase a regra |
| **Sombra difusa** | `--shadow-float` é a única, e separa cromo de mapa | Existe uma camada de elevação só. Duas nunca foram tentadas |
| **Grade de botões de peso idêntico** | Sem hierarquia, nada é ação primária | — |
| **Toast / snackbar** | Erro aparece no painel, onde a ação aconteceu | — |
| **Tooltip só de hover** | Sem equivalente de teclado nem de toque | — |
| **Skeleton loader** | Os dados vêm renderizados no servidor | — |
| **Modal** | O padrão é painel lateral, folha inferior abaixo de 768px | — |

**Animação, motion e transformação de ícone não estão travados por decisão
nenhuma.** Já existe um sistema de movimento (§6), com durações, curvas e política
de movimento reduzido — e ele está subaproveitado. É terreno aberto: use a base
que existe ou substitua-a por inteiro.

Os únicos dois pontos que um redesign não consegue contornar continuam sendo os
do §1 — **a leitura sobrevive à luva, ao sol e ao acostamento**, e **medido,
estimado e opinião continuam distinguíveis sem ler a legenda**. Você pode resolver
os dois de um jeito completamente diferente do atual. Fora isso, o terreno é seu.

---

## 4. Estado atual — tokens reais

Todos os valores abaixo são os que estão em `src/app/globals.css` hoje. As razões
de contraste foram medidas sobre `--color-base`.

### Superfícies — couro escurecido

```
--color-void     #11100f   fundo da página, atrás de tudo
--color-base     #181716   superfície de painel
--color-raised   #201e1c   elevação dentro de painel
--color-overlay  #2a2726   hover, estado ativo surdo
```

Matiz 30°, **saturação baixa de propósito**: superfície é área, e cor saturada
repetida por 65% da tela vira banho e não sobra nada contra o que o âmbar se
destaque. O calor mora no que está **em cima** da superfície. Isto é o [ADR 0012],
que corrigiu a dosagem do [ADR 0009].

### Traços

```
--color-line         rgba(234, 227, 216, 0.1)
--color-line-strong  rgba(234, 227, 216, 0.2)
```

Hairline de 1px faz a separação estrutural **no lugar de sombra**. Tingido de
areia, não de branco puro, para não esfriar a superfície.

### Tinta

```
--color-ink        #eae3d8   14.05:1
--color-ink-muted  #b7ad9f    8.09:1
--color-ink-faint  #93887a    5.15:1  (AA em texto normal)
```

### Acento — amarelo queimado de instrumento

```
--color-accent         #e0a02e   7.87:1  painel de moto, farol, GPS outdoor
--color-accent-strong  #c9861a           hover de ação primária
--color-accent-dim     #6b4b12           preenchimento surdo, nunca texto
--color-on-accent      #14100c   8.33:1  sobre o acento
```

### Dois vocabulários de estado, deliberadamente separados

```
estado do DADO                  estado de uma OPERAÇÃO
--color-visited    #8fa36a      --color-ok     #8fa36a
--color-wanted     #e0a02e      --color-warn   #e0a02e
--color-unvisited  #93887a      --color-alert  #d4694a
```

Coincidem em valor hoje e **podem divergir amanhã**. Um lugar visitado não é uma
operação bem-sucedida. Não unifique.

### Tipografia

Sans **Archivo** (eixo de largura variável), mono **JetBrains Mono**.

```
--text-micro    12px / 1     rótulo de instrumento, statusbar
--text-small    15px / 1.5   dica de campo, legenda
--text-body     17px / 1.55  PISO do corpo
--text-lead     20px / 1.4   primeira linha de painel
--text-title    24px / 1.2   nome de lugar, título de tela
--text-display  32px / 1     só display
```

Não existe `text-base` nesta escala, e escrever essa classe é **erro silencioso**:
não gera CSS e o elemento herda o tamanho do pai.

Quatro classes utilitárias carregam o caráter:
`.instrument-label` (mono, 12px, caixa alta, tracking 0.16em),
`.instrument-value` (mono, tabular-nums, tracking 0.02em),
`.type-display` (largura 125%, peso 700, caixa alta),
`.type-title` (largura 115%, peso 700),
`.type-wordmark` (largura 125%, tracking 0.06em — a assinatura, nunca 0.18em, que
faria "RASTRO" ler como legenda).

### Espaçamento, raio, sombra

```
--space-tight    8px    entre rótulo e seu controle
--space-snug     12px   entre controles irmãos
--space-panel    20px   respiro interno de painel
--space-section  32px   entre blocos de assunto diferente

--radius-sm 8 / md 14 / lg 20 / xl 28 / 2xl 36 / full 999px

--shadow-float  0 18px 40px -24px rgb(0 0 0 / 0.9)
```

A sombra é **uma só** e não é decoração: é o vinco que separa o cromo flutuante
do mapa que passa por baixo. Difusão curta, deslocamento negativo grande.

### Geometria do cromo

```
--chrome-gap      12px    folga da borda e entre peças
--bar-height      104px < 768px, 56px ≥ 768px
--status-height   36px
--sheet-height    45vh    folha inferior abaixo de 768px
--panel-narrow    280px   --panel-base 380px   --panel-wide 420px
--z-map 0 → --z-map-chrome 10 → --z-panel 20 → --z-bar 30
--focus-width 2px  --focus-offset 3px  --disabled-opacity 0.45
```

---

## 5. O mapa não lê variável CSS

MapLibre desenha em **WebGL**. As cores de `src/lib/map/style.ts` e
`src/lib/map/layers.ts` são **hex literal** e espelham a paleta à mão. Mudar uma
sem a outra faz interface e mapa divergirem — foi o que aconteceu no ADR 0009 e
exigiu refazer o estilo cartográfico junto.

**Toda proposta de paleta precisa vir com as duas metades.**

Estilo cartográfico atual (os três princípios permanecem: *estrada é o conteúdo*,
*fundo cede o palco*, *relevo importa*):

```
fundo        #0d0d0c
água         #0e1a29        contorno  #182b45
vegetação    #131d10 (75%)  mata      #172313 (60%)
relevo       sombra #000000  realce #3a3835  acento #131311
vias         #34322f → #655d51 → #948a7c → #c2b9a7   (4 níveis, do menor ao maior)
rótulos      #b7ad9f e #d9d1c4, halo #11100f
POI          traço #948a7c, texto #948a7c, halo #0d0d0c
```

Pins (`layers.ts`, camadas data-driven — [ADR 0005]):

```
VISITED #8fa36a   WANTED #e0a02e   UNVISITED #93887a
HOLLOW #181716 (miolo do pin não visitado)   BONE #eae3d8
```

Traçado de viagem: **é a marca virando dado**. Traço âmbar `#e0a02e` com faixa
central tracejada `#11100f` na cor do fundo — o único lugar do produto onde a
geometria da identidade vira informação literal.

---

## 6. O sistema de movimento que já existe

Um ritmo só, declarado uma vez. **Sem bounce, sem elastic. Saída sempre ~70% da
entrada.**

```
--dur-instant  90ms    press, feedback tátil
--dur-fast     140ms   hover, cor
--dur-base     220ms   entrada de painel, revelação
--dur-slow     320ms   primeira pintura do mapa
--dur-signal   400ms   realce de valor que mudou

--ease-out-quart  cubic-bezier(0.25, 1, 0.5, 1)
--ease-out-quint  cubic-bezier(0.22, 1, 0.36, 1)
--ease-in         cubic-bezier(0.4, 0, 1, 1)

--motion-shift  12px   deslocamento de entrada/saída de painel
--motion-press  0.98   recuo do toque
--stagger-step  35ms   trava em 8 itens, total nunca passa de 280ms
--empty-delay   120ms  antes de mostrar estado vazio
```

Peças de movimento já implementadas: entrada/saída de painel com
`@starting-style` e saída segurada por `useExitTransition`; `.stagger-item`;
`.press`; `.value-changed` (realce de contagem); `.map-surface` (fade da primeira
pintura); `.empty-state`.

O deslocamento é **pequeno de propósito**: um slide desde fora da tela leria como
gaveta de app mobile e puxaria o olho para longe do mapa, que é o oposto do que
os painéis existem para fazer.

### `prefers-reduced-motion` em três camadas — inegociável

Deliberadamente **não** é o `* { animation-duration: 0.01ms !important }` de
manual, que mataria também a câmera do mapa (que aqui é navegação, não enfeite) e
o crossfade dos pins (que é a única evidência de que o recorte mudou).

- **Zerado:** deslocamento e fade de painel, stagger, press, fade do mapa — tudo
  que é transform ou revelação decorativa.
- **Preservado:** `--dur-signal` e o crossfade de opacidade dos pins, porque
  **carregam informação**.
- **Delegado:** a câmera do MapLibre honra a preferência sozinha, desde que não
  se passe `essential: true`.

Toda animação nova proposta precisa declarar em qual das três camadas cai.

---

## 7. Inventário completo — tudo que precisa de tratamento

### 7.1 Marca e identidade
- `Logo` — marca isolada, com e sem placa arredondada
- Lockup marca + `.type-wordmark`
- Favicon / `icon.svg` (geometria duplicada, mexer nas duas)
- Tratamento da marca na barra, na tela de entrada e como ícone de app

### 7.2 Cromo de layout
- **`TopBar`** — marca, 4 destinos com glifo **e** rótulo, "Novo lugar", "Sair".
  Duas linhas abaixo de 768px (numa barra de 366px não cabem os seis elementos;
  rolar na horizontal cortava "Descobrir" no meio da palavra)
- **`nav-icons`** — 4 glifos desenhados à mão, traço 1.75, pontas arredondadas,
  sem preenchimento. "Viagens" é a curva da marca. **A única exceção de ícone do
  produto** ([ADR 0011])
- **`StatusBar`** — coordenada, zoom, contagem de lugares, origem. Tudo mono
- **`OverlayPanel`** — painel lateral ≥768px, folha inferior abaixo. Entrada,
  saída, empilhamento, `data-side` esquerda/direita
- **`DataFallback`**, **`MapFallback`** — sem banco, sem chave de mapa

### 7.3 Mapa
- Estilo cartográfico completo (fundo, água, vegetação, relevo sombreado, 4
  níveis de via, rótulos, POI de combustível)
- **Pins** — 3 estados de visita × favorito (anel externo) × `photoDot` × hover ×
  selecionado, e o crossfade entre recortes
- **Traçado da viagem** — asfalto âmbar + faixa central tracejada
- **`PointPicker`** — escolher coordenada tocando no mapa
- Câmera, `padding` por rota, atribuição do MapLibre reestilizada

### 7.4 Primitivos (`src/components/ui/`)
`Button` (solid / outline / ghost, dois tamanhos) · `Chip` (ativo/inativo) ·
`Toggle` · `Stat` (rótulo + valor mono + unidade) · `Field` + `Input` + `Select`
+ `Textarea` · `CloseButton` · `InlineMessage` (info / erro / ok) ·
`Section` + `SectionHeader` + `Divider` · `RatingPicker` (1 a 5 em mono, **sem
estrelas**, porque estrela é ícone decorativo) · `Logo`

### 7.5 Explorar
- **`FilterRail`** — dois modos: lista por padrão, filtros por cima sob demanda.
  Existe assim porque os quatro blocos de filtro somavam **1017px numa coluna de
  861px** e cortavam a seção "Situação" ao meio
- **`PlaceSearch`** — busca por nome, município ou etiqueta
- **`PlaceList`** — lista, contagem, estado vazio com saída de um clique
  ("Remover busca — 14 lugares")
- **`PlacePanel`** — cabeçalho, `Stat` distância/tempo, `VisitStatusBadge`,
  `PlaceStateControls`, `PlaceSurface`, `PlaceVisits`, `VisitReview`,
  `PlacePhotos`, `PlaceNearbyPhotos`, `PlaceActions`
- **`PlaceForm`**, `NewPlaceView`, `EditPlaceView`

### 7.6 Descobrir
- **`DiscoveryLauncher`** — o CTA "PARA ONDE VAMOS?" flutuando sobre o mapa
- **`DiscoveryForm`** — tempo disponível, distância, categorias
- **`DiscoveryResults`**, `DiscoveryView`

### 7.7 Viagens
- **`TripList`**
- **`TripProposalForm`** — 456 linhas, o maior arquivo do produto. Proposta,
  medição real, edição de paradas, nome, salvar. **Candidato a divisão**
- **`TripItineraryView`** — cabeçalho, aviso de estimado, aviso de chão no
  caminho, previsão, altimetria, lista de paradas, ações
- **`RouteWeatherPanel`** — chips de dia, frase do ponto crítico, linha por
  parada
- **`ElevationProfile`** — SVG com hairlines no ponto mais alto e mais baixo,
  traço âmbar, área chapada, três leituras em mono
- **`TripCompletionForm`**, **`TripDeleteAction`**

### 7.8 Memórias
- **`MemoryTimeline`** — cabeçalho de mês **sticky**, entradas de visita/viagem/
  foto, miniatura de foto, grupo "sem data conhecida"
- **`YearInReview`** — leituras do ano, só o que aconteceu

### 7.9 Onboarding e perfil
- **`OriginSetup`** — busca de endereço com sugestões + escolher no mapa
- Autonomia da moto

### 7.10 Estados transversais
Vazio · carregando (**sem skeleton** — os dados vêm do servidor) · erro ·
indisponível (opacidade 0.45, rótulo continua legível) · foco visível (anel âmbar
em 100% dos controles) · seleção de texto · movimento reduzido · offline/sem
chave

---

## 8. O que precisa vir junto para isto virar código

Nenhum item aqui é um aro para pular. São as coisas sem as quais a proposta não é
implementável — e uma proposta linda que não vira código não serve para nada.

1. **Paleta completa em duas metades** — tokens CSS **e** os hex literais do mapa
   (§5) —, com contraste medido nos pares de texto. Se as duas metades não vierem
   juntas, a interface e o mapa nascem divergentes.
2. **Escala tipográfica** inteira, e o que acontece com as classes de caráter
   (`.instrument-label`, `.instrument-value`, `.type-display`, `.type-title`,
   `.type-wordmark`) — mantidas, renomeadas ou substituídas.
3. **Movimento**: o que entra, com duração e curva, e o que acontece sob
   `prefers-reduced-motion`.
4. **Tratamento de cada elemento do §7.** Pode ser uma linha por elemento nos que
   só herdam o sistema — o que não pode é elemento sem menção, porque aí ele fica
   por último e nasce fora do sistema.
5. **Onde a proposta contraria o §3**, dito em uma frase por item. Sem
   justificativa longa: quem implementa escreve o ADR.
6. **Como a distinção entre medido, estimado e opinião se lê** no desenho novo.
7. **Como fica em 390px de largura**, que é onde o produto é usado de verdade.

Formato livre — documento, telas anotadas, tokens em CSS, o que comunicar melhor.
A implementação vem depois, arquivo por arquivo, com verificação visual a cada
etapa (§9).

E se você tiver uma ideia que não cabe em nada disto: **traga assim mesmo.** O
inventário é o chão, não o teto.

---

## 9. Como este produto verifica trabalho visual

Isto não é exigência sobre você — é como o trabalho vai ser conferido depois, e
saber disso ajuda a propor coisas que sobrevivem ao contato com a tela.

Não se declara pronto o que não foi visto. O repositório roda um navegador
headless contra a aplicação real, autenticado, e mede o DOM e o mapa. Foi assim
que apareceram, entre outros: a coluna de filtros somando **1017px dentro de uma
coluna de 861px**, o nome da serra sendo cortado ao lado do rótulo de neblina, e
o balanço do ano exibindo "VIAGENS 0" e "FOTOS 0" como um placar de ausências.

Nenhum dos três foi encontrado por raciocínio. Os três foram encontrados olhando.
Desenhe contando com isso: a medida real vence a intenção, sempre.

---

## 10. Onde ler mais

`docs/DESIGN-SYSTEM.md` (482 linhas — o sistema atual, token a token) ·
`docs/2026-07-27-auditoria-de-design.md` (a auditoria que derrubou a primeira
direção) · [ADR 0005] pins · [ADR 0009] direção visual · [ADR 0010] cromo
flutuante · [ADR 0011] ícones na navegação · [ADR 0012] o calor mora sobre a
superfície.

[ADR 0005]: ./decisions/0005-pins-como-camadas-data-driven.md
[ADR 0009]: ./decisions/0009-direcao-visual-couro-e-instrumento.md
[ADR 0010]: ./decisions/0010-cromo-flutuante-sobre-mapa-sangrando.md
[ADR 0011]: ./decisions/0011-icones-na-navegacao-principal.md
[ADR 0012]: ./decisions/0012-o-calor-mora-sobre-a-superficie.md
