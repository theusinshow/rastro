# 0010 — Cromo flutuante sobre mapa sangrando

**Altera** a geometria de painel descrita em `docs/DESIGN-SYSTEM.md`. **Não
altera** o [ADR 0002](./0002-mapa-persistente-no-layout.md): o mapa continua
vivendo no layout e sobrevivendo à navegação.

## Contexto

Até aqui o cromo era **ancorado**: a barra superior ocupava uma faixa de altura
fixa, a barra de status outra no rodapé, e os painéis colavam nas bordas
laterais da área que sobrava. A separação vinha de hairline, e o mapa recebia o
retângulo restante.

Isso é a linguagem de um aplicativo de painéis. Mas o Rastro não é um aplicativo
de painéis com um mapa dentro — o mapa **é** o produto, e o `CLAUDE.md` já dizia
isso: *"mapa como estrutura, nunca dentro de um card"*.

Havia uma incoerência silenciosa: o mapa era declarado como estrutura, e ao mesmo
tempo era o único elemento que **não** ia até a borda da tela. Ele era, na
prática, o buraco no meio do cromo.

## Decisão

**O mapa sangra de borda a borda. Todo o cromo flutua sobre ele**, com folga das
bordas, raio da escala e hairline.

| Elemento | Antes | Agora |
|---|---|---|
| Mapa | Retângulo entre as barras | Viewport inteira |
| Barra superior | Faixa ancorada no topo | Barra flutuante, folga de 12px |
| Barra de status | Faixa ancorada no rodapé | Barra flutuante |
| Painéis | Colados na borda lateral | Flutuantes, entre as duas barras |
| Folha inferior | Colada no rodapé | Flutuante, acima da barra de status |

Tokens novos, em `:root`:

- `--chrome-gap` — folga entre o cromo e a borda da tela, e entre peças de cromo.
- `--bar-height` / `--status-height` — altura das duas barras. Os painéis leem as
  duas para saber onde começar e terminar: sem isso, mudar a altura de uma barra
  faria o painel passar por baixo dela em silêncio.
- `--shadow-float` — o vinco que separa o cromo do mapa. Ver abaixo.

### Emenda — a única sombra do produto

O [ADR 0009](./0009-direcao-visual-couro-e-instrumento.md) proíbe sombra: a
separação vem de hairline de 1px. Aquela regra foi escrita para cromo **ancorado**,
onde a peça vizinha é uma superfície opaca e o hairline tem contra o que
contrastar.

Sobre mapa isso deixa de valer. O hairline é `rgba(240,228,210,0.1)`, e quando o
que passa por baixo é relevo escuro ele desaparece: a barra e o mapa viram a mesma
mancha, e a peça não lê mais como algo que flutua **sobre** outra coisa.

**`--shadow-float: 0 18px 40px -24px rgb(0 0 0 / 0.9)`** é a única sombra do
produto. Usam-na `TopBar`, `StatusBar` e `.overlay-panel` — e nada mais.

O deslocamento negativo de 24px é o ponto: ele encolhe a sombra para menos que a
peça, e o que sobra é um **vinco embaixo dela**, não um halo em volta. É o que
distingue esta sombra da "sombra difusa" que o ADR 0009 recusa — aquela decora
uma caixa, esta declara qual camada está por cima. Não abre precedente para
sombra em botão, campo, seção ou card.

## Motivos

- **Coerência com o que o produto afirma ser.** Um mapa que é estrutura ocupa a
  tela; um mapa que é conteúdo ocupa um retângulo. Estávamos dizendo a primeira
  coisa e desenhando a segunda.
- **É a convenção da categoria**, e convenção aqui não é preguiça: quem usa mapa
  espera que ele continue por baixo do que está por cima, porque isso comunica
  que a superfície é contínua e que o painel é temporário.
- **Ganha mapa sem perder cromo.** A área de mapa cresce pela altura das duas
  barras somada, e o cromo continua legível por `backdrop-blur` sobre `base/92`,
  parente do `base/85` que o produto já usava na barra superior.

## Consequências

- **Nada de meia adoção.** Barra flutuante sobre painel ancorado lê como dois
  produtos colados. Se um flutua, todos flutuam — foi por isso que esta mudança
  não pôde ser só da barra de navegação.
- **O `padding` da câmera precisa somar a folga.** Ele já espelhava as larguras
  de painel à mão porque o MapLibre não lê variável CSS; agora espelha também o
  `--chrome-gap`. Divergir faz o pin selecionado terminar embaixo de um painel.
- **Contraste passa a depender do que está atrás.** O cromo já não tem uma
  superfície opaca garantida sob ele. `base/92` com `backdrop-blur` é o que
  mantém o texto legível sobre relevo sombreado e sobre água quase preta — é
  legibilidade, não efeito, e continua sendo o único uso de blur permitido.
- A regra **"nenhum card contendo conteúdo primário" continua valendo**. O que
  flutua é cromo: navegação, filtro, detalhe. O conteúdo primário é o mapa, e ele
  é a superfície — não o que está dentro de uma caixa.

## Gatilho de revisão

Se o produto ganhar telas sem mapa — estatísticas, uma timeline de memórias sem
recorte geográfico —, o cromo flutuante perde o que o justifica ali, e essas
rotas precisarão de uma geometria própria em vez de flutuar sobre nada.
