# 0012 — O calor mora sobre a superfície, não nela

**Corrige** a paleta de superfícies do
[ADR 0009](./0009-direcao-visual-couro-e-instrumento.md). **Não substitui** a
direção "couro e instrumento": o âmbar, a tipografia, a escala de raio e a regra
do hairline continuam valendo, e o objetivo aqui é fazer o couro funcionar, não
abandoná-lo.

## Contexto

O ADR 0009 trocou a superfície de carvão frio por couro queimado. Isso estava
certo em direção e errado em dosagem, e a queixa que abriu esta revisão foi
direta: *"tô achando tudo muito marrom"*.

Não foi debatido no gosto. Foi medido, sobre a tela real renderizada:

| | Antes |
|---|---|
| Área na faixa de matiz 15–50° (laranja/marrom) | **65%** |
| Área acromática (saturação < 4%) | **0,2%** |
| Saturação média da tela | **25%** |
| Matiz das seis cores dominantes | todas entre **27° e 34°** |

O produto tinha **um matiz só**. Não havia contraste de matiz em lugar nenhum —
apenas o mesmo marrom em degraus de luminosidade. O resultado é o que o próprio
ADR 0009 dizia querer evitar: lavagem sépia.

E havia uma consequência pior que a estética. O âmbar do acento existe para ser
a coisa mais quente da tela. Sobre um fundo já quente, ele não tinha **contra o
que** se destacar: o pin de "quero conhecer" competia com o chão em vez de saltar
dele.

## Decisão

**O que é fundo perde quase toda a saturação. O que é conteúdo mantém a sua.**

- **Fundo** (superfícies da interface, terreno, relevo, divisas): saturação
  reduzida a **28%** do valor original. O matiz continua em 30° — a superfície
  continua quente ao toque, só deixa de ser *marrom*.
- **Conteúdo** (texto, estradas, rótulos): saturação reduzida a **62%**. Continua
  visivelmente areia.
- **Água** sobe de `#080a0f` para `#0e1a29`.
- **Mata** fica mais verde: `#141a0c` → `#131d10`.

| Token | ADR 0009 | Agora |
|---|---|---|
| `--color-void` | `#14100c` | `#11100f` |
| `--color-base` | `#1c1712` | `#181716` |
| `--color-raised` | `#251e17` | `#201e1c` |
| `--color-overlay` | `#302620` | `#2a2726` |
| `--color-ink` | `#f0e4d2` | `#eae3d8` — 14,05:1 |
| `--color-ink-muted` | `#bfae97` | `#b7ad9f` — 8,09:1 |
| `--color-ink-faint` | `#9a8973` | `#93887a` — 5,15:1 |

**Âmbar, verde de visitado e vermelho de alerta não mudam.** Eles ficam mais
fortes sem receber um único ajuste, só por passarem a ter fundo contra o qual
contrastar.

Resultado medido na mesma tela: faixa laranja/marrom de **65% para 30%**, área
acromática de **0,2% para 21,6%**, saturação média de **25% para 18%**.

## Motivos

- **Saturação é multiplicada pela área.** Um tom a 22% de saturação numa etiqueta
  é caráter; o mesmo tom cobrindo a tela inteira é banho de cor. O erro do ADR
  0009 não foi escolher couro — foi aplicar a intensidade de um detalhe a uma
  superfície.
- **O acento precisa de um fundo que não compita.** "Instrumento" é justamente
  isso: mostrador escuro e neutro, ponteiro quente. Painel de moto não é marrom
  atrás do ponteiro.
- **A água era a maior massa fria disponível, e estava escondida.** A 4,5% de
  luminosidade ela era fria no papel e buraco preto na tela. O Atlântico aparece
  em qualquer vista do litoral catarinense: revelá-lo resolve sozinho boa parte
  do desequilíbrio, e é cartografia honesta.
- **Texto e estrada continuam quentes porque são o que se lê.** Dessaturar tudo
  por igual conserta o marrom e apaga o couro junto — foi testado e descartado.

## Consequências

- **A paleta agora tem uma regra, e não só uma lista.** Cor nova entra
  respondendo: isto é fundo ou é conteúdo? A resposta define a saturação.
- **O espelho manual do mapa ficou mais caro de manter.** `globals.css`,
  `src/lib/map/style.ts` e `src/lib/map/layers.ts` carregam a mesma paleta em
  três lugares porque o MapLibre desenha em WebGL e não lê variável CSS. Esta
  mudança tocou os três, mais `icon.svg` e `apple-icon.png`. O risco que o ADR
  0009 já registrava continua de pé.
- **Todas as razões de contraste foram remedidas, não estimadas.** A menor é
  `ink-faint` em 5,15:1, ainda acima de AA para texto normal.
- O `background` do mapa continua um degrau abaixo de `--color-void`, como antes.

## Gatilho de revisão

Se o produto ganhar um tema claro, a regra "fundo perde saturação" precisa ser
reescrita: sobre superfície clara, saturação baixa vira lavado, não neutro.
