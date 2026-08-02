# Home: o mapa, a pergunta e a vitrine

**Data:** 2026-08-02
**Rota afetada:** `/` — `src/app/(app)/page.tsx` → `ExploreView`

---

## O problema

A home hoje abre com quatro superfícies de cromo disputando o mapa: a trilha da
esquerda com busca, lista e filtros; o botão de descoberta embaixo; a chave de
postos; e o painel do lugar quando há um selecionado. O mapa — que o ADR 0010
declara como estrutura — chega ao olho como o que sobra entre painéis.

E a pergunta central do produto, *"para onde vamos?"*, é um botão do mesmo peso
visual que dezenove controles de refinamento em volta dele.

## A decisão

A home passa a ter **três coisas**: o mapa, a pergunta, e uma vitrine de lugares
que faltam conhecer.

Filtrar continua possível — deixa de ser o estado inicial.

---

## Escopo

### O que sai da tela inicial

`FilterRail` não nasce mais aberta. Busca, lista e filtros passam a abrir sob
demanda por uma cápsula "Lugares" no alto à esquerda da área de mapa, ao lado da
chave "Postos" que já mora ali. **O painel em si não muda** — só deixa de ser o
estado inicial.

A cápsula fica **antes de "Postos" na ordem de foco**. Isso não é detalhe de
gosto: hoje a lista é o único caminho de teclado até um lugar, e é a costura
entre lista e mapa — está escrito no cabeçalho do próprio `FilterRail`. Esconder
a lista sem lhe dar uma porta alcançável por tabulação seria uma regressão de
acessibilidade disfarçada de limpeza visual.

O deslocamento `md:left-[calc(var(--panel-base)+…)]` que a chave "Postos" aplica
hoje passa a valer **só com a trilha aberta**. Com ela fechada, as duas cápsulas
encostam na borda.

### O que cresce

`DiscoveryLauncher` vira a peça principal da tela. O destaque vem de duas coisas,
nesta ordem de importância:

1. **Ele fica sozinho.** Sem a trilha, é a única peça de cromo sobre o mapa fora
   das barras. É o ganho maior, e é de graça.
2. Um degrau de tamanho.

**O âmbar continua como contorno e texto, nunca como preenchimento.** Âmbar cheio
sobre o mapa significa "quero conhecer" no vocabulário dos pins, e gastá-lo num
botão de navegação faria o olho tratar o botão como dado. A regra já está no
cabeçalho do componente e não muda aqui.

### O que entra

Um carrossel de lugares no canto inferior direito.

---

## O carrossel

### Quais lugares

`visitStatus !== 'visitado'` — o que ainda falta conhecer. Na mesma ordem em que
o passeio de câmera os percorre, para que mapa e vitrine nunca discordem.

Degrada bem por construção: para quem acabou de entrar nada está visitado, então
o catálogo inteiro aparece, e ele encolhe conforme a pessoa roda.

### De onde sai a imagem

Em escada, e o primeiro degrau que responder vence:

1. `place.coverImageUrl` — capa curada. Sem etiqueta: é nossa e é do lugar.
2. Foto do Wikimedia Commons **com coordenada**, com a distância escrita no
   cartão, como o painel já faz.
3. Nenhuma das duas → **o lugar não vira cartão.**

**Fotos casadas por nome ficam de fora.** Num painel elas são toleráveis porque a
etiqueta declara a procedência e a pessoa julga — `PlaceNearbyPhotos` documenta
que procurar "Santo Amaro da Imperatriz" devolve o hospital do município. Num
carrossel de vitrine a foto é o argumento inteiro, e ilustrar a serra com o
hospital é o produto afirmando o que não sabe.

**Consequência aceita:** o carrossel nasce curto. Pela medição registrada em
`PlaceNearbyPhotos`, dez dos catorze lugares do catálogo da época não tinham foto
com coordenada. Ele fica cheio quando as capas forem curadas — trabalho de
conteúdo, não de código.

### Como avança

Acoplado ao passeio de câmera. `ExploreTour` já anuncia a parada em
`onStopChange`; o cartão ativo passa a ser essa parada. Mapa e foto contam a
mesma história.

**No primeiro gesto o passeio morre e o carrossel para de andar sozinho** — a
mesma regra que o `ExploreTour` já aplica, e pela mesma razão registrada lá: uma
ferramenta que se mexe sozinha enquanto você a usa não é apresentação, é defeito.
Dali em diante o carrossel é manual: arraste, setas do teclado, e os pontos de
posição.

`prefers-reduced-motion` sai de graça: o passeio já o respeita, e sem passeio o
carrossel nasce manual.

### O que o clique faz

Seleciona o lugar. A câmera voa até o pin e o `PlacePanel` abre — com "Abrir
rota" e "Montar roteiro com este lugar" já lá dentro, que são exatamente as duas
saídas pedidas. Nenhuma rota nova, nenhuma ação nova.

### O que o cartão mostra

Foto, nome, categoria e a distância desde a origem.

A distância é conta, não medição: **régua tracejada e `~` na frente**. Sem origem
no perfil, régua pontilhada e `—`. É a regra do ADR 0016 e não abre exceção por
ser um cartão pequeno.

---

## Layout

### Desktop (≥768px)

```
┌──────────────────────────────────────────────┐
│  Rastro  [Explorar][Descobrir][…]   [+ Novo] │  TopBar
│                                              │
│ [Lugares][Postos]                            │
│                 M A P A                      │
│                                  ┌─────────┐ │
│         ┌──────────────────┐     │ [ foto ]│ │
│         │ PARA ONDE VAMOS  │     │ SERRA   │ │
│         │ HOJE?          → │     │ ~178 km │ │
│         └──────────────────┘     │ ● ○ ○ ○ │ │
│ ──────────────────────────────────────────── │  StatusBar
└──────────────────────────────────────────────┘
```

O botão centraliza na faixa entre a borda esquerda e o carrossel.

**Com o `PlacePanel` aberto, o carrossel some.** Os dois moram no mesmo canto, e
é a regra que `ExploreView` já aplica entre `PlacePanel` e `FuelPanel`: um painel
por vez do lado direito. Além disso a vitrine perdeu a função — a escolha já foi
feita.

### Celular (<768px)

```
┌──────────────────┐
│  Rastro   [+][☾] │
│                  │
│      M A P A     │
│                  │
│ ‹ [foto][foto] › │  faixa rolável
│ ┌──────────────┐ │
│ │ PARA ONDE    │ │  no alcance do polegar
│ │ VAMOS?     → │ │
│ └──────────────┘ │
│ [nav][nav][nav]  │  BottomNav
└──────────────────┘
```

Canto inferior direito não existe no celular: ali moram a `BottomNav` e a
atribuição do mapa. O carrossel vira faixa horizontal acima do CTA, que continua
sendo a peça mais baixa alcançável.

O `bottom` do CTA **perde a parcela `--sheet-height`**: ela existia para o botão
subir acima da folha de filtros, que não abre mais por padrão.

### A câmera

`CAMERA_PADDING` em `ExploreView` reserva hoje `380 + 24` à esquerda para uma
trilha que deixou de estar lá, e `420 + 24` à direita para o painel. Com a trilha
fechada por padrão a conta muda, e **esquecer isso deixa a câmera enquadrando o
pin selecionado fora do centro da área visível** — exatamente o defeito que o
comentário daquela constante existe para prevenir.

---

## Arquitetura

### Domínio — `src/domain/carousel.ts`

Funções puras. É aqui que os testes vão, e só aqui.

```ts
/** O que falta conhecer, na ordem do passeio. */
carouselPlaces(places: ExplorePlace[]): ExplorePlace[]

/** Capa curada > Commons com coordenada > nada. */
resolveCardImage(
  place: ExplorePlace,
  photos: CommonsPhoto[],
): CardImage | null
```

`CardImage` carrega a URL e a procedência (`'capa' | 'commons'`), mais a
distância em metros quando a procedência for `commons` — é o que o cartão precisa
para escrever a etiqueta sem decidir nada.

### Servidor — `src/app/(app)/page.tsx`

As imagens são resolvidas **no servidor**, não no cliente. Um `Promise.all` sobre
os lugares sem capa, e o carrossel chega pronto: sem cascata de fetch, sem cartão
que aparece e some depois de a resposta chegar.

Isso exige uma mudança pequena em `src/lib/photos/commons.ts`: o `fetch` não
declara cache hoje, e uma dúzia de chamadas sem cache a cada visita é abusar de
uma API aberta e gratuita que ainda pede identificação de quem consulta. Entra
`next: { revalidate }`. Foto do Commons para uma coordenada fixa não muda por
hora.

O carrossel fica atrás de `<Suspense fallback={null}>`: mapa e CTA pintam na
hora, a vitrine entra quando o Commons responde. **`null` e não skeleton** — o
ADR 0016 proíbe skeleton, e `PlaceNearbyPhotos` já resolve assim, com a
justificativa escrita: uma seção que não existe ainda é mais honesta que um
retângulo cinza fingindo conteúdo que pode nunca chegar.

### Componente — `src/components/explore/PlaceCarousel.tsx`

Apresentação pura. Recebe os cartões e o índice ativo, emite `onSelect` e
`onIndexChange`. Não filtra, não ordena, não calcula distância, não decide o que
mostrar — conforme a regra de camadas do `CLAUDE.md`.

Sem dependência nova: `scroll-snap` e teclado, na casa das 60 linhas. A regra do
repositório prefere código próprio a wrapper, e um carrossel é o caso mais claro
disso.

### Costura — `ExploreView`

Passa a guardar o índice ativo e alimentar dois consumidores com ele: o anel de
realce do pin (o `hoveredSlug` que já existe) e o cartão do carrossel.

---

## O que este trabalho NÃO faz

- **Não muda a semântica dos pins.** Visitado, quero conhecer e não visitado
  continuam com as cores que têm. "Lugares destacados" é o anel de realce do
  cartão ativo, reusando `hoveredSlug`. Apagar os visitados seria mudança de
  camada data-driven e exigiria um ADR sobre o 0005.
- **Não cria rota nem ação nova.** "Abrir rota" e "montar roteiro" já existem em
  `PlaceActions`.
- **Não cura capas.** `coverImageUrl` continua `null` no catálogo. É a tarefa que
  faz o carrossel ficar cheio, e é de conteúdo.
- **Não instala nada.**

---

## Riscos declarados

1. **O carrossel nasce curto** — poucos lugares têm foto do Commons com
   coordenada. Aceito conscientemente: a alternativa era ilustrar lugares com
   fotos que podem ser de outro ponto do município.
2. **Esconder a lista mexe no caminho de teclado até um lugar.** Mitigado pela
   ordem de foco da cápsula "Lugares", e é o ponto a conferir antes de dar o
   trabalho por concluído.
3. **A home passa a depender de uma API externa para uma parte da tela.** Mitigado
   pelo `Suspense` com fallback nulo e pelo timeout que o cliente do Commons já
   aplica: se o Commons não responder, a home é o mapa e a pergunta — que é
   exatamente o que ela precisa ser.

---

## Definição de concluído

Além da lista do `CLAUDE.md`:

- [ ] Tabular a partir do topo alcança "Lugares" antes de "Postos"
- [ ] Nenhum número no cartão sem régua
- [ ] `CAMERA_PADDING` refeito e o pin selecionado centrado na área visível
- [ ] Carrossel oculto com o `PlacePanel` aberto
- [ ] Testes de `src/domain/carousel.ts` — e nenhum teste de componente
