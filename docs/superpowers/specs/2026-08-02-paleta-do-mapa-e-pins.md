# Paleta do mapa e visibilidade dos pins — estado da decisão

**Data:** 2026-08-02
**Situação:** decidido pela metade. Nada foi implementado.

Este documento existe para a próxima sessão não refazer as medições. Todos os
números aqui saíram da mesma função de contraste de `src/lib/map/palette.test.ts`,
rodada contra as cores reais de `src/lib/map/palette.ts`.

---

## O que foi decidido

**A paleta vai para a variante "A combinada"** — ajuste dos valores atuais, sem
tema novo e sem trocar o estilo autoral por um estilo pronto.

Ela é a soma de duas propostas que mexem em coisas quase disjuntas:

| | de | para | origem |
|---|---|---|---|
| `background` | `#16120f` | `#131311` | A1 |
| `hillshadeExaggeration` | `0.42` | `0.62` | A1 |
| `hillshadeShadow` | `#0a0704` | `#050403` | A1 |
| `hillshadeHighlight` | `#665d4e` | `#867a68` | A1 |
| `hillshadeAccent` | `#1d1913` | `#1a1a15` | A1 |
| `water` | `#22384f` | `#1a4463` | A2 |
| `waterOutline` | `#31506e` | `#417095` | A2 |
| `vegetation` | `#1d2617` | `#1b2f16` | A2 |
| `forest` | `#243019` | `#213c1a` | A2 |

A1 dá forma às serras; A2 devolve a massa fria do Atlântico e tira o banho de
marrom. As vias e os rótulos não mudam.

**Recusadas, e por quê:** um terceiro tema (o `ThemeToggle` é de dois estados por
desenho — o glifo *é* o estado), satélite, e estilo pronto do MapTiler. As duas
últimas trocam decisão de ADR, não ajustam valor.

---

## O defeito que apareceu no caminho

**O teste de contraste dos pins mede contra `map.background`, que é a cor do
vazio.** Ela só aparece onde nada mais desenha. Na tela o pin pousa sobre relevo,
mata ou água — e contra o que ele realmente toca, dois dos três estados reprovam
o piso de 3.00 da WCAG:

| estado | fundo (medido hoje) | mata | água | encosta iluminada |
|---|---|---|---|---|
| visitado | 3.10 ✓ | 2.60 | 2.00 | **1.08** |
| quero conhecer | 9.98 ✓ | 8.39 | 6.44 | 3.47 |
| não visitado | 6.60 ✓ | 5.54 | 4.26 | **2.29** |

É a mesma forma de defeito dos três que motivaram o
[ADR 0022](../../decisions/0022-um-teste-que-abre-o-produto.md): teste verde,
produto quebrado.

**E a paleta A piora isso**, porque clarear o terreno é exatamente o que rouba
contraste do pin — relação de soma zero, e o cabeçalho de `palette.test.ts` já
avisava. Contra a encosta A1 (`#867a68`):

- visitado: 1.08 → 1.43 (ainda menos da metade do piso)
- **quero conhecer: 3.47 → 2.25** — o único estado que passava deixa de passar

---

## O que já foi descartado, com número

**Trocar a cor do visitado não resolve.** Ele precisa ficar a ≥3:1 do âmbar
(exigência do ADR 0019 — os dois são discos cheios e nada além da cor os separa)
e a ≥3:1 do terreno de meio-tom ao mesmo tempo. Não existe verde que faça as duas:

```
#4d6c2b (hoje)  vs âmbar 3.22 ✓  | vs encosta 1.43 ✗
#5c8033         vs âmbar 2.45 ✗  | vs encosta 1.09 ✗
#6b9440         vs âmbar 1.90 ✗  | vs encosta 1.19 ✗
#79a84a         vs âmbar 1.50 ✗  | vs encosta 1.50 ✗
```

**Conclusão que vale para qualquer esquema de cor:** nenhuma cor sobrevive a uma
encosta iluminada a 0,62 de exagero. **A casca é obrigatória**, não é preferência.

Com casca `#100d0b` por baixo do pin, a superfície que ele encosta deixa de ser o
terreno:

```
casca vs encosta A1   4.61 ✓
visitado vs casca     3.22 ✓
quero conhecer        10.38 ✓
não visitado           6.86 ✓
```

Rendido e conferido no navegador. Junto com a casca, o raio do miolo sobe de
3,5–6,5 para 4,5–8 — 11px de diâmetro é pouco para alvo de mapa.

---

## O que ficou em aberto

**O esquema semântico dos pins.** A proposta em cima da mesa, do dono do produto:

> Todos os pins em âmbar por padrão, verde quando visitado, borda quando
> selecionado.

O que ela ganha: **significado**, não visibilidade. Dois estados — *já fui* e
*ainda não fui* — em vez de três codificados em duas cores e um vazado.

O que ela custa: **"o que ainda quero conhecer" some do mapa**, e é uma das
quatro perguntas que o princípio do produto no `CLAUDE.md` diz que o Rastro
existe para responder.

A saída proposta, não decidida: **promover "quero conhecer" de cor para anel**. O
pin continua âmbar e ganha um anel externo — o mesmo recurso que hoje marca
favorito. Mantém os quatro estados, deixa o padrão alto, e move a distinção da
cor (esgotada) para a forma (livre). **Conflito a resolver: o anel já é de
`isFavorite`**, e `wantsToVisit` e `isFavorite` são flags distintas em
`PlaceUserState`.

**A próxima sessão começa aqui:** renderizar as duas variantes — a proposta pura
e a proposta com anel — com uma distribuição de estados forçada, porque o
catálogo real é quase todo "não visitado" e sem isso não há o que comparar.

---

## O que isso vai exigir quando for implementado

- `src/lib/map/palette.ts` **e** `src/app/globals.css` na mesma passada. O
  MapLibre desenha em WebGL e não lê variável CSS; mudar uma metade sem a outra
  faz interface e mapa divergirem.
- `src/lib/map/layers.ts` — casca e raio.
- `src/lib/map/palette.test.ts` — **medir contra o terreno e contra a casca**, não
  contra o fundo. Sem isso a próxima mexida na paleta quebra tudo outra vez em
  silêncio.
- **Um ADR novo**, substituindo a parte de medição do
  [ADR 0019](../../decisions/0019-contraste-medido-na-paleta-do-mapa.md). Não é
  ajuste de valor: muda o que se mede. O `CLAUDE.md` proíbe mudar decisão
  registrada em silêncio.

Esperado, e não é problema: o teste refeito deve reprovar pares que hoje passam.
Quando reprovar, recalibra-se a cor — não se afrouxa o piso.

---

## Comparações renderizadas

Capturas do mapa real, com os tiles reais, no mesmo enquadramento. Não são
maquetes: as cores foram aplicadas nas camadas do MapLibre e a tela capturada.

- Seis paletas: <https://claude.ai/code/artifact/ba087533-294f-496f-90fc-6e1c0445dd1c>
- Os pins somem no terreno: <https://claude.ai/code/artifact/da785707-dbbb-42ba-93cc-8fe857585242>
