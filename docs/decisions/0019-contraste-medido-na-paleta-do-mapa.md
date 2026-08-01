# 0019 — Contraste medido na paleta do mapa

Substitui a parte de **paleta do mapa** do
[ADR 0016](./0016-a-regua-diz-de-onde-veio-o-numero.md). A paleta da interface
em `globals.css` **não muda** — ver "A divergência deliberada", abaixo.

## Contexto

O pedido era subjetivo: o mapa estava escuro demais e os pins difíceis de
distinguir. Medir transformou isso em dois defeitos concretos, e o mais grave
não era o que parecia.

**Os pins contra o fundo sempre estiveram bem** — 6:1 a 9:1, folgado acima do
piso de 3:1 para elemento não textual. O defeito era outro:

| Par | Antes |
|---|---|
| visitado × quero-conhecer (escuro) | **1.19:1** |
| visitado × quero-conhecer (claro) | **1.006:1** |

"Não visitado" se salvava por ser **oco** — a forma o distingue, não a cor. Mas
visitado e quero-conhecer eram os dois cheios, separados apenas por matiz e
praticamente na mesma luminância. Para quem tem daltonismo vermelho-verde — algo
como 8% dos homens, e este é um produto de motociclista — eram **o mesmo pin**.
Num raio de 7px sob sol, para qualquer um.

O tema claro estava pior que o escuro, a 1.006:1: luminância idêntica. Ninguém
tinha notado, e é o ponto — **o defeito era invisível na revisão**. Duas cores
diferentes no arquivo, duas manchas iguais na tela.

O segundo defeito era a cartografia:

| Contra o fundo `#0d0d0c` | Antes |
|---|---|
| Água | 1.12:1 |
| Vegetação | 1.13:1 |
| Via local | 1.54:1 |
| Faixa do relevo (realce × sombra) | 1.82:1 |

Água a 1.12:1 significa não enxergar o mar nem as lagoas, num produto sobre
pilotar em Santa Catarina. E a sombra do hillshade era **preto puro** sobre um
fundo quase preto: as serras não tinham como existir.

## Decisão

### 1. Quem recua é o visitado

O âmbar de "quero conhecer" é o acento de instrumento do ADR 0016 e não pode
escurecer. Então quem desce é o visitado, e a separação passa a ser de
**luminância** — que sobrevive ao daltonismo e ao sol, enquanto matiz não.

Isso também acerta a semântica: o que você ainda quer conhecer deve chamar mais
que o que você já fez.

| | Antes | Agora | Separação |
|---|---|---|---|
| Escuro | `#93a86e` / `#e5a338` | `#4d6c2b` / `#f0b34a` | 1.19 → **3.22:1** |
| Claro | `#445d24` / `#7d4a06` | `#2a3b12` / `#b87615` | 1.006 → **3.26:1** |

No claro, "recuar" é escurecer até virar quase tinta, e não clarear. É o mesmo
princípio do arquivo da paleta invertendo entre os temas, como já invertia para
as vias: **contraste é distância do fundo, não claridade.**

### 2. O relevo ganha faixa de modelagem

A sombra deixa de ser `#000000` e o realce sobe: a faixa vai de 1.82:1 para
3.10:1. É a mudança mais visível de todas — é ela que faz serra parecer serra,
e é o que faltava nas capturas do sobrevoo do ADR 0018, que pareciam um buraco.

### 3. A água sobe por matiz, não por luz

`#101b2a` → `#22384f` dá 1.55:1 de luminância, que a norma chama de nada. Mas
**razão de contraste só mede luminância, e é cega para matiz**: um azul saturado
contra marrom-carvão é obviamente outra coisa. Isso vale para fundo cartográfico
e não valeria para texto — daí os rótulos continuarem medidos contra 4.5:1.

### 4. O fundo do escuro ESCURECEU

Contraintuitivo, porque o pedido era "menos escuro". Mas a relação é de **soma
zero**: todo passo que o terreno clareia rouba contraste dos pins. Não existe
paleta escura em que a vegetação suba a 1.5:1 do fundo **e** os pins fiquem a
3:1 entre si — as duas restrições se contradizem, e isso foi verificado, não
suposto.

Escolhemos os pins. A vida vem do relevo e da matiz. Quem quiser um mapa de fato
claro tem o tema `claro`, onde há espaço de luminância sobrando — e essa é uma
decisão de identidade, não de acessibilidade.

## A divergência deliberada

**`pin.visited` não é mais `--color-visited`.** O `CLAUDE.md` manda mudar as duas
metades da paleta na mesma passada, e a regra continua valendo — o que muda é que
aqui a divergência é intencional e documentada, não um esquecimento.

O motivo é que os dois têm requisitos **opostos**:

| | Superfície | Piso | `#4d6c2b` |
|---|---|---|---|
| `--color-visited` | texto na lista e no roteiro | 4.5:1 | **2.96:1 — reprova** |
| `pin.visited` | disco sobre o mapa | 3:1 do âmbar | 3.22:1 — passa |

Um token só não atende os dois. É exatamente a razão pela qual `--color-accent` e
`--color-accent-fill` já são separados no `globals.css`, com o comentário
dizendo que "um token só faria botão sólido ilegível de dia". Mesmo problema,
mesma solução: mesma matiz nos dois lugares, tom escolhido pela superfície.

Como consequência, `globals.css` não foi tocado: os três textos de estado já
estavam em 6.83, 5.68 e 8.15:1.

## Consequências

- **`src/lib/map/palette.test.ts` passa a travar os números.** Quinze invariantes
  medidas nos dois temas. Isto é o que impede a regressão silenciosa: o defeito
  original sobreviveu a revisões porque hex não se lê como contraste.

- **Mexer na paleta agora quebra o CI de propósito.** Dada a soma zero, qualquer
  ajuste futuro empurra algum número para baixo. O teste é onde isso vira
  conversa em vez de descoberta tardia.

- **O tema claro foi corrigido junto, sem ter sido pedido.** Tinha o mesmo
  defeito e pior. Deixá-lo falhando depois de medido seria registrar um problema
  conhecido e seguir adiante.

- **A escada de vias do claro ficou apertada** — local a 1.73:1 e coletora a
  1.96:1, monótona mas de degrau curto. Sobre areia há menos espaço abaixo do
  fundo do que há acima dele no escuro. Fica registrado como dívida, não como
  acerto.

- **A correção dos pins não foi verificada no olho**, só nos números e no teste:
  as contas de teste não têm lugar visitado nem "quero conhecer", então os dois
  pins não aparecem numa captura. A cartografia, essa, foi verificada rodando.

## Gatilho de revisão

Reavaliar se o tema claro virar o padrão. Nesse ponto o orçamento de luminância
inverte, o argumento de soma zero deixa de valer como está escrito aqui, e a
pergunta "quanto o terreno pode viver" tem outra resposta.
