# 0016 — A régua diz de onde veio o número

**Substitui** o [ADR 0009](./0009-direcao-visual-couro-e-instrumento.md) na
paleta e na lista de anti-padrões, e o
[ADR 0011](./0011-icones-na-navegacao-principal.md) no escopo de uso de ícone.
**Mantém** o [ADR 0010](./0010-cromo-flutuante-sobre-mapa-sangrando.md) e o
[ADR 0012](./0012-o-calor-mora-sobre-a-superficie.md) inteiros.

## Contexto

O dono encomendou uma direção visual nova e completa, com liberdade explícita:
*"quero dar liberdade pro Claude design trabalhar"*. O briefing entregue está em
`docs/PROMPT-REDESIGN.md`; a proposta devolvida está em `claude-design/`, e foi
aprovada com uma única ressalva — o mapa precisava entrar no mesmo tema.

A direção anterior estava certa no caráter e incompleta num ponto: o produto
passou a carregar **três naturezas de número na mesma tela** — medido, estimado e
opinião — e resolvia a distinção com palavras. A viagem dizia por escrito
"distância e tempo são estimados"; o painel do lugar não dizia nada e mostrava
`161 km` liso, que se lê como distância rodada.

Palavra é caro e é lento. Numa tela lida de luva, no acostamento, ninguém lê a
ressalva antes do número.

## Decisão

**Toda leitura numérica do produto se apoia numa régua de 2px, e essa régua é a
legenda.**

| Origem | Régua | Valor |
|---|---|---|
| **Medido** | sólida, âmbar | `1822` |
| **Estimado** | tracejada 5/5, areia | `~ 172` — o prefixo é obrigatório |
| **Desconhecido** | pontilhada 2/4, apagada | `—`, nunca um palpite |
| **Contagem** | sólida surda | `3` |
| **Opinião** | **nenhuma** | sai do mono, vira sans, filete de citação |

Quatro origens, quatro formas, nenhuma palavra necessária.

### Por que a estrada, e não um ícone

A faixa central tracejada **já é a marca** — é a perna do R. **Já é o traçado da
viagem no mapa.** E já significa, no mundo, asfalto interrompido. Interrompido é
exatamente o que um número estimado é.

Também sobrevive ao contexto de uso: é geometria de 2×48px, não um glifo de 12px.

A regra irmã, que é a outra metade do mesmo sistema: **medição é mono, humano é
sans**. `RatingPicker` fica em mono porque é escala, mas **nunca** ganha régua,
porque é opinião.

`Stat` sem régua é defeito, não é variação de estilo.

## O que este ADR derruba, e por quê

O ADR 0009 listava anti-padrões. Três caem:

1. **Card com conteúdo primário.** A regra nasceu quando o produto era só o mapa,
   e card empurrava o mapa para dentro de uma caixa. Hoje existem Viagens,
   Memórias e o balanço do ano, que não são o mapa. **O mapa continua sem caixa;**
   o que passa a poder ser card é o que nunca foi mapa.
2. **Segunda camada de elevação.** Agora há painel sobre painel — o do lugar abre
   por cima da trilha, e o balanço do ano sobe sobre a linha do tempo. Com uma
   camada só os dois viram uma massa chapada e se perde qual tem o teclado.
   `--shadow-lift` nunca aparece sozinha: **quem tem a camada 2 tem o foco.**
3. **Ícone fora da navegação** (ADR 0011). O argumento original vale para ícone
   **sozinho**: glifo sem rótulo é adivinhação com luva e sol na tela. Passa a ser
   permitido onde o glifo vem **com rótulo colado** ou onde o glifo **é o próprio
   estado** — a bússola do CTA, o alvo do seletor de ponto. Glifo decorativo
   continua proibido.

**Continuam proibidos, sem exceção:** gradiente decorativo, dashboard de widgets,
grade de botões de peso idêntico, toast, tooltip só de hover, skeleton, modal.

## Paleta

A família é a mesma. O que mudou e por quê:

| Token | Antes | Agora | Motivo |
|---|---|---|---|
| `--color-void` | `#11100f` | `#0e0d0c` | afunda mais que o fundo do mapa |
| `--color-base` | `#181716` | `#191817` | um grau mais quente |
| `--color-ink` | `#eae3d8` | `#ede6db` | 14.31:1 |
| `--color-ink-faint` | `#93887a` | `#9b9082` | **era 4.29:1 sobre `overlay` — abaixo de AA** |
| `--color-accent` | `#e0a02e` | `#e5a338` | em direção ao farol, 8.13:1 |
| `--color-alert` | `#d4694a` | `#d97456` | mais terracota, 5.56:1 |

O caso do `ink-faint` é o que justifica a passada inteira: `--color-overlay` é a
superfície de hover, e texto apagado sobre ela **não passava na norma**. Agora o
pior par do sistema inteiro cabe dentro dela — medido, não estimado: ink 11.67 ·
muted 6.92 · faint 4.62 · accent 6.63 · visited 5.55 · alert 4.53.

Entram quatro tokens de destino da navegação — âmbar, terracota, oliva e azul de
carta náutica. Eles vivem em `@theme static`, e isso **não é preferência**: são
lidos por `var()` a partir de um `--tint` inline, nunca por uma utilitária, e o
Tailwind remove do CSS entregue todo token de `@theme` que nenhuma regra
referencia. Sem `static`, o destino ativo sai com fundo transparente — foi medido
no navegador.

## Consequências

- **O mapa foi refeito na mesma passada.** Ele desenha em WebGL e não lê variável
  CSS; mudar só um lado é exatamente o que fez interface e mapa divergirem no ADR
  0009. O tracejado do traçado da viagem foi de 2/3 para 4.5/5.5 para ser a
  **mesma** faixa da régua de estimado.
- **Uma cor por destino**, igual sempre. O rótulo nunca é colorido — quatro
  palavras coloridas competiriam por atenção e nenhuma seria estado.
- **O mostrador deixou de ser barra de largura total.** Ocupando a tela inteira
  embaixo, ele reivindicava a importância de uma barra de ferramentas para quatro
  leituras que ninguém aciona. Some abaixo de 768px, onde a folha já mostra a
  contagem.
- **A política de movimento reduzido passa a ser declarada por `data-motion`**, e
  não só descrita: animação de traço em SVG não passa por token de duração e
  sobreviveria a zerar as durações. As três camadas continuam as mesmas —
  zerado, preservado, delegado.
- **Botão vira pílula.** Pílula é a forma do que se aperta; retângulo arredondado
  fica reservado à superfície, que é o que se lê.

## O que NÃO mudou

- O piso de 17px no corpo e 12px no rótulo. O alvo de 44px, agora com token
  próprio (`--hit-min`).
- A escala tipográfica inteira, e as cinco classes de caráter.
- Espaçamento e raio.
- Hairline de 1px como separação estrutural.
- Os dois vocabulários de estado separados — `visited`/`wanted`/`unvisited` para
  o dado, `ok`/`warn`/`alert` para a operação. Coincidem em valor e podem
  divergir amanhã.
- O mapa como estrutura, sangrando sob todo o cromo.

## A variante clara

Implementada logo depois, a pedido do dono, e ela obrigou a uma decisão que a
escura escondia: **o acento se parte em dois papéis**. `--color-accent` é a cor
de texto, régua e borda; `--color-accent-fill` é a de preenchimento, com
`--color-on-accent` medido sobre o segundo. Com um token só, todo botão sólido
ficaria com tinta quase preta sobre marrom escuro.

A cartografia clara foi **derivada aqui**, e não entregue: o handoff deu o mapa de
dia como filtro CSS sobre tiles do OSM, um atalho de protótipo que ele mesmo manda
descartar. A derivação inverte o que precisa inverter — a rodovia passa a ser a
via mais **escura**, porque o que faz a estrada ser o conteúdo é a distância do
fundo, não a claridade — e reduz o exagero do relevo de 0.38 para 0.28, porque
sombra sobre areia pesa mais que sombra sobre carvão.

As duas paletas vivem lado a lado em `src/lib/map/palette.ts`, no mesmo arquivo,
para que acrescentar uma cor sem acrescentar a irmã seja erro de tipo.

O tema vem de cookie lido no **servidor** e escrito no `<html>` antes de qualquer
pintura: resolver no cliente daria um quadro inteiro no tema errado a cada carga.

### Duas armadilhas, para não se repetirem

- **`setStyle` derruba todas as camadas nossas.** Os pins registravam uma vez por
  instância de mapa e sumiriam ao trocar de tema. Passaram a escutar `styledata`,
  como o traçado da viagem já fazia — mesmo modo de falha silenciosa.

  > **Correção posterior: esta escuta não bastava, e o defeito continuou de pé.**
  >
  > Dentro dela havia um `if (!map.isStyleLoaded()) return`, e `isStyleLoaded()`
  > não significa "dá para acrescentar camada" — significa "o estilo **e as
  > fontes dele** terminaram de carregar", que acontece bem depois. Medido no
  > navegador ao alternar dia e noite: `styledata` e `style.load` chegam os dois
  > com `isStyleLoaded() === false`, e depois deles não vem mais nada. A guarda
  > rejeitava exatamente os eventos que a escuta existia para pegar.
  >
  > Na prática, os pins **continuaram sumindo** ao trocar de tema, e o traçado da
  > viagem junto — este por um segundo motivo, que a escuta dele se desregistrava
  > após o primeiro sucesso. Nada disso deu erro, e nenhum teste alcançava.
  >
  > O sinal correto é `style.load`, e a condição correta é o estilo **existir**.
  > A regra está isolada em `src/lib/map/style-lifecycle.ts`, com teste — três
  > camadas cometeram o mesmo engano de três formas, e centralizar é o que
  > impede a quarta.
- **O preenchimento do destino ativo é constante entre os temas**; só o glifo do
  inativo escurece. É o que faz a cor ser identificador de lugar na aplicação em
  vez de enfeite.

## Pendência

- [ ] Nenhuma.

## Gatilho de revisão

Se um dia uma leitura numérica não couber em nenhuma das quatro origens da régua,
é sinal de que o sistema está incompleto — e a resposta é acrescentar uma quinta
forma, não deixar o número sem régua.
