# 0018 — O mapa atravessa a entrada

## Contexto

O [ADR 0002](./0002-mapa-persistente-no-layout.md) pôs o mapa no layout do grupo
`(app)` para que navegar entre Explorar, Viagens e Memórias não desmontasse a
instância do MapLibre. Funcionou para o que ele mirava — e parou uma rota antes
do começo.

`/entrar` vive **fora** do grupo `(app)`, e montava o próprio `MapProvider` e o
próprio `MapCanvas`. O efeito era invisível enquanto o mapa da entrada era
cenário parado: entrar destruía uma instância, criava outra no mesmo
enquadramento, e ninguém percebia a costura.

A primeira impressão do produto passou a importar — o Rastro começou a ser
mandado para outras pessoas avaliarem, o que motivou também o
[ADR 0017](./0017-sessao-anonima-como-entrada-de-visitante.md). E a partir do
momento em que a entrada tem **movimento de câmera**, a costura deixa de ser
invisível: o sobrevoo terminaria, a pessoa clicaria em entrar, e o mapa
recomeçaria do zero — contexto WebGL novo, estilo remontado, um instante de tela
vazia. Exatamente no momento em que o produto está tentando causar impressão.

## Decisão

**`MapProvider` e `MapCanvas` sobem para o layout raiz.** A entrada e o grupo
`(app)` passam a desenhar apenas o próprio cromo por cima de um mapa que já
está lá, e que é o mesmo do começo ao fim da sessão.

Isto **estende** o ADR 0002 em vez de substituí-lo: o argumento dele era que
remontar o MapLibre custa caro e perde estado, e esse argumento vale igual — ou
mais — na única transição que ele não cobria.

### Três consequências que exigiram código

**1. A interatividade deixa de ser do construtor.** `MapCanvas` recebia
`interactive`, e a entrada passava `false`. Com uma instância só, atravessando
rotas com necessidades opostas, a opção do construtor voltaria a exigir um mapa
novo a cada mudança. Passa a ser `setMapInteractive` em
`lib/map/interactivity.ts`, chamada por rota.

O `tabIndex` faz parte disso e não é detalhe: o MapLibre põe o canvas na ordem
de tabulação quando ele é interativo, e na tela de entrada isso punha uma parada
de foco morta antes do único botão da tela. Era o que a opção do construtor
resolvia de graça, e passou a ser responsabilidade nossa.

**2. O sinal de chegada cabe numa variável de módulo.** O sobrevoo precisa
avisar o app onde parou. Com o mapa remontando, isso exigiria cookie, parâmetro
na URL ou armazenamento — todos frágeis e todos visíveis. Com a instância viva,
entrada e app são o mesmo contexto de JavaScript, e `lib/map/arrival.ts` é um
booleano consumido uma vez.

**3. O `bg-void` mudou de dono.** Era do contêiner de cada tela; passa a ser do
contêiner do mapa, na raiz. As telas ficam transparentes por cima.

## Consequências

- **O mapa monta em toda rota de interface**, inclusive numa página de erro.
  Antes isso já valia para as duas telas que existem, então na prática muda
  pouco — mas passa a ser regra, e não coincidência. Uma rota futura que não
  queira mapa precisará dizê-lo.

- **Uma rota nova é cenário ou instrumento, e alguém tem que declarar.** A lista
  `SCENERY_PATHS` em `MapChrome` é curta hoje (`/entrar`) e é o lugar onde isso
  se declara. Esquecer significa uma tela de leitura com mapa arrastável atrás.

- **`MapCanvas` não tem mais props.** Quem quiser mudar o comportamento do mapa
  por rota mexe em `MapChrome`, não no canvas.

- **O custo do sobrevoo é real e não some.** Relevo 3D com câmera inclinada é o
  momento mais pesado que este produto já teve. Ele é cortado inteiro por
  `prefers-reduced-motion`, e o relevo é desligado no pouso — mas um aparelho
  lento sem essa preferência ligada vai sentir os onze segundos. Medir em
  aparelho real continua pendente; o que foi medido até aqui é navegador
  headless com GL por software.

## Gatilho de revisão

Reavaliar se aparecer uma rota de interface que não queira mapa nenhum — uma
tela de leitura longa, uma página de erro que precise de fundo próprio. Nesse
ponto a decisão vira "o mapa é o fundo padrão, com exceções declaradas", que é
outra coisa e merece registro.
