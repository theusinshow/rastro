# 0021 — O primeiro minuto depois de entrar

**Estende** o [ADR 0018](./0018-o-mapa-atravessa-a-entrada.md): o mapa continua
sendo a mesma instância do começo ao fim da sessão, e agora ele também **se
move** dentro do aplicativo — sob uma regra de parada que este ADR define.
**Mantém** o [ADR 0010](./0010-cromo-flutuante-sobre-mapa-sangrando.md) e o
[ADR 0016](./0016-a-regua-diz-de-onde-veio-o-numero.md) inteiros.

## Contexto

O produto ficou bom no segundo minuto e continuava fraco no primeiro.

Quem entrava caía no Explorar com catorze pins e uma lista — e **sem ponto de
partida**, porque nada nunca tinha perguntado por ele. Sem partida, o raio do
filtro fica indisponível, a distância de cada lugar some da lista, a Descoberta
mostra um muro e os postos não sabem de onde medir. Metade do produto responde
`—`, e a outra metade pede a mesma coisa: *defina a sua origem*. Quatro telas
pedindo a mesma coisa é pior do que uma tela perguntando uma vez.

Ao mesmo tempo, o movimento que dá vontade de usar o Rastro — a câmera passeando
pelos lugares de verdade — existia **só antes de entrar**. Passava a impressão
certa para quem estava avaliando o produto e sumia justamente para quem tinha
acabado de decidir usá-lo. E o botão que responde a pergunta central,
"Para onde vamos hoje?", era o elemento mais discreto da tela.

## Decisão

### 1. A entrada pergunta de onde se sai — uma vez, com saída

`destinationAfterEntry` (`src/domain/onboarding.ts`) decide para onde vai quem
acabou de entrar. **Sem origem, e indo para o destino padrão**, a pessoa cai em
`/perfil/origem`.

Duas exceções, e as duas importam:

- **Quem já tem origem vai direto para o mapa.** A pergunta é de primeira vez,
  não de toda vez.
- **Quem entrou para chegar a um lugar específico chega lá.** Se a sessão expirou
  no meio de uma viagem e o login trouxe `proximo=/viagens/serra`, sequestrar
  esse caminho para perguntar o endereço de casa seria trocar a intenção da
  pessoa pela nossa.

A tela ganha **uma saída visível** — "Depois — ir para o mapa" —, e ela só
aparece na primeira vez, que é quando existe. Uma primeira tela sem saída é um
muro, e muro é exatamente o padrão que a auditoria derrubou na Descoberta
(RASTRO-003). O produto continua inteiro sem origem: o mapa abre, os lugares
aparecem, a lista funciona. O que some é o que depende de um ponto de partida — e
some dizendo por quê.

As ações saíram da área que rola e viraram rodapé fixo do painel, como em
`PlacePanel`. Medido em 1440×900: com tudo numa coluna só, "Definir origem"
ficava cortado na borda e a saída não aparecia sem rolar. **Uma saída que exige
rolar para ser descoberta não é saída.**

O visitante recebe a mesma pergunta, porque tem o mesmo problema — e a mesma
saída.

### 2. O passeio entra no aplicativo, e para no primeiro gesto

O mapa do Explorar passeia pelos lugares do catálogo, como a tela de entrada já
fazia. **Duas diferenças, e nenhuma é estética.**

**A câmera é de instrumento, não de cenário.** `TOUR_INSTRUMENT` é plano, ao
norte, sem relevo 3D, e mais aberto (zoom 10,2 contra 11,2). O norte é fixo por
decisão de cartografia — `MapCanvas` desliga a rotação para o usuário e
`setMapInteractive` a mantém desligada nos dois estados. Um passeio que
inclinasse e girasse deixaria o mapa **torto** no instante em que a pessoa
tocasse nele, e ela não teria como endireitar, porque a rotação está desligada
justamente para ela. O perfil plano também elimina o que desfazer ao parar:
devolver `pitch` e `bearing` ao zero enquanto alguém já está arrastando seria a
câmera brigando com a mão.

**Ele termina no primeiro gesto, e não volta.** Qualquer `pointerdown`, `wheel`,
`keydown` ou `touchstart` na janela encerra o passeio para o resto da sessão
(`lib/map/explore-tour.ts`). Escutado na janela com captura, e não no canvas:
mexer na trilha de filtros também precisa parar a câmera — um passeio que
continua voando enquanto alguém lê uma lista atrapalha em vez de convidar.

É essa regra que mantém a decisão honesta, e é ela que responde à objeção óbvia
de mover a câmera numa tela de trabalho: **o passeio só acontece quando a pessoa
literalmente não tocou em nada desde que a página abriu.** Voltar de Viagens para
o Explorar não recomeça nada, porque para navegar até lá foi preciso clicar em
algo — e aquele clique já o dispensou.

O lugar sob a câmera recebe o **anel de realce** do pin, reaproveitando o mesmo
`hoveredSlug` que costura a lista ao mapa. Nenhum vocabulário visual novo entra
por causa disto.

Movimento reduzido não roda o passeio. Não é decorativo o bastante para
sobreviver à preferência, ao contrário do crossfade dos pins, que é a única
evidência de que um recorte mudou.

### 3. O botão da descoberta cresceu e ficou opaco

De 15px para 17px no celular e 20px no desktop, com mais respiro e a seta maior.
E a superfície deixou de ser `base/85` com desfoque: virou `.chrome-capsule`, a
mesma peça em relevo da barra do topo e do mostrador.

As duas mudanças têm a mesma causa. Com o mapa passeando por trás, uma superfície
translúcida é legível sobre um enquadramento e cinza sobre o seguinte — um CTA
que pisca de contraste enquanto a paisagem passa por baixo é o pior lugar da tela
para economizar opacidade.

**O âmbar continua como contorno e texto, nunca como preenchimento.** Âmbar cheio
sobre o mapa significa "quero conhecer" no vocabulário dos pins, e gastar isso
num botão de navegação faria o olho tratar o botão como dado. A decisão anterior
segue de pé; o que mudou foi o tamanho e o material, não a cor.

O deslocamento horizontal passou a ler `--panel-base`, que é a largura real da
trilha do Explorar. Lia `--panel-narrow` — 100px a menos, herdados de quando a
trilha era mais estreita —, e o botão nascia descentralizado por causa de um
token que a trilha não usa mais.

## O defeito que isto revelou

`arrival.ts` existe para que a câmera se assente ao chegar no app, e quem emitia
o bilhete era o `MapFlyover`, ao pousar. Quando a entrada trocou o sobrevoo pelo
passeio, **o bilhete parou de ser emitido**: `consumeArrival()` passou a devolver
`false` sempre, e a volta ao enquadramento em `MapChrome` virou código morto.

A consequência era visível e ninguém tinha por onde notar: o passeio da entrada
deixa a câmera inclinada em 55° com o relevo 3D ligado, e entrar levava esse
enquadramento para dentro do produto. O mapa do aplicativo aparecia **torto**,
numa aplicação onde a rotação está desligada justamente para o norte ser fixo — e
sem nenhum gesto capaz de endireitá-lo.

`EntranceTour` passa a chamar `markArrival()` na montagem. Marcado na montagem, e
não ao terminar, porque este passeio é contínuo: ele não pousa, ele é
interrompido por quem entra.

## Consequências

- **O mapa se move sozinho dentro do aplicativo**, o que o ADR 0018 não previa.
  A regra de parada é o que separa isto de um enfeite: um gesto, e acabou para a
  sessão.
- **A rota `/perfil/origem` ganhou dois papéis** — onboarding e edição — e o
  componente distingue os dois por `origin === null`, que é a mesma condição que
  mandou a pessoa para lá. Duas fontes para o mesmo fato divergiriam.
- **`runTour` passou a receber um perfil de câmera.** O padrão continua sendo o
  de cenário, então a tela de entrada não mudou uma linha.
- **`MapFlyover` e `lib/map/flyover.ts` estão órfãos** desde que a entrada trocou
  o sobrevoo pelo passeio. Ficam para uma limpeza própria: apagá-los aqui
  misturaria remoção de código morto com mudança de comportamento no mesmo
  commit.

## Gatilho de revisão

Se alguém reclamar que o mapa "se mexe sozinho", a resposta **não** é encurtar o
passeio: é conferir se a regra de parada está pegando o gesto daquela pessoa. Um
passeio que sobrevive a um toque é um defeito, não uma dose alta.
