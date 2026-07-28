# 0009 — Direção visual: couro e instrumento

**Substitui** as decisões de paleta, teto de raio e tipografia registradas em
`docs/DESIGN-SYSTEM.md` e no bloco "Direção visual" do `CLAUDE.md`.

## Contexto

A primeira direção visual do Rastro era **carvão frio verde-esverdeado**
(`#0a0c0b`, `#101413`) com âmbar `#f0a32b`, tipografia Geist e um **teto de raio
de 2px** aplicado ao produto inteiro. A auditoria de design de 2026-07-27
aprovou o resultado: *"Isto não parece template. Parece um instrumento."*

Duas coisas, porém, apareceram depois:

1. **A auditoria também flagrou tamanho.** O texto de instrumento a 10px falhava
   contraste em uso informativo (P1.4) e os alvos de toque de 24px eram
   inviáveis para o dedo (P2.6). As correções da fase anterior expandiram a área
   clicável sem mexer na caixa visual — resolveram o alvo, não a leitura.
2. **O contexto de uso é hostil.** Este produto é consultado parado no
   acostamento, com luva, sol na tela, e por um público que não tem vinte anos.
   Uma linguagem de densidade máxima serve à leitura de instrumento e trabalha
   contra a leitura na estrada.

## Decisão

Adotar uma direção visual de **couro e instrumento**: a superfície deixa de ser
carvão frio e passa a ser couro queimado; o acento passa a amarelo queimado; a
escala de raio deixa de ter teto de 2px; a tipografia troca por uma grotesca de
largura variável somada a uma mono de leitura.

### Paleta

| Token | Antes | Agora |
|---|---|---|
| `--color-void` | `#0a0c0b` | `#14100c` |
| `--color-base` | `#101413` | `#1c1712` |
| `--color-raised` | `#171c1a` | `#251e17` |
| `--color-overlay` | `#1e2422` | `#302620` |
| `--color-ink` | `#e8edea` | `#f0e4d2` — areia, 14.17:1 sobre base |
| `--color-ink-muted` | `#9aa5a0` | `#bfae97` — 8.23:1 |
| `--color-ink-faint` | `#7b8884` | `#9a8973` — 5.25:1 |
| `--color-accent` | `#f0a32b` | `#e0a02e` — 7.82:1 |
| `--color-visited` | `#3fbf8f` | `#8fa36a` — oliva, 6.45:1 |
| `--color-unvisited` | `#7d8a85` | `#9a8973` — 5.25:1 |

Entram três tokens que não existiam: `--color-accent-strong` (hover de ação
primária), `--color-on-accent` (texto sobre âmbar, antes `text-void` hardcoded)
e `--color-alert` (erro).

### Raio

O teto de 2px cai. Escala nova: `8 / 14 / 20 / 28 / 36 / 999px`.

**Isto é a mudança mais visível e a que mais contraria a decisão anterior.** O
argumento original era que arredondamento é decoração. O argumento novo é que
uma superfície de couro tem raio, e que a leitura de instrumento vem do mono, do
tracking e da caixa alta — não da quina viva. A regra que **permanece** é a de
sempre: nada é arredondado sem razão; a escala existe para que o raio seja
proporcional ao tamanho do elemento, não para decorar.

### Tipografia

| | Antes | Agora |
|---|---|---|
| Sans | Geist Sans | **Archivo** (eixo de largura variável) |
| Mono | Geist Mono | **JetBrains Mono** |
| Corpo | 14–16px conforme o caso | **17px de piso** |
| `.instrument-label` | 10px | **12px** |

O piso de 17px e o label de 12px são resposta direta aos achados P1.4 e P2.6 da
auditoria. O eixo de largura do Archivo permite `.type-display` e `.type-title`
sem carregar uma terceira família.

## O que NÃO muda

Explicitamente preservado, porque não é o que estava errado:

- **Hairline de 1px no lugar de sombra.** Nenhuma sombra difusa entra.
- **Nenhum card contendo conteúdo primário.** O mapa é estrutura. O substituto
  do card continua sendo seção delimitada por hairline dentro de um painel.
- **Todo dado numérico em mono**, com `tabular-nums`.
- **Acento de instrumento**, não azul de SaaS.
- **Ícone só quando substitui texto.**
- **A política de `prefers-reduced-motion` em três camadas** e toda a escala de
  movimento. O redesign é de cor, forma e tipo — não de comportamento.
- **Painel lateral no lugar de modal; mensagem no painel no lugar de toast.**

## Consequências

- **O estilo cartográfico precisa ser refeito junto.** O MapLibre desenha em
  WebGL e não lê variável CSS: as 18 cores de `src/lib/map/style.ts` e as três de
  `layers.ts` são hex literal. Sem refazê-las, a interface quente flutuaria sobre
  um mapa verde-carvão frio. Os três princípios do estilo — estrada é o conteúdo,
  fundo cede o palco, relevo importa — permanecem; muda só a família de matiz.
- Todo componente existente é retocado (raio, tamanho, cor).
- O contraste de cada par novo foi medido, não estimado, e está documentado
  token a token em `docs/DESIGN-SYSTEM.md`.

## Desvio deliberado em relação à referência

A referência que originou esta decisão renomeava `--color-visited` para
`--color-ok` e usava o mesmo token para "lugar visitado" e "operação bem
sucedida". **Não adotamos.** Um lugar visitado não é um estado de sucesso: são
dois significados que hoje coincidem em valor e que podem divergir amanhã sem
que nada avise. Os dois vocabulários ficam separados — `visited`/`wanted`/
`unvisited` nomeiam o **dado**, `ok`/`warn`/`alert` nomeiam o **estado de uma
operação**.

## Gatilho de revisão

Se o produto voltar a ser usado majoritariamente na mesa, e não na estrada, o
argumento de tamanho enfraquece e a densidade anterior volta a ser defensável.
