# 0022 — Um teste que abre o produto

**Estende** o [ADR 0001](./0001-stack-e-limite-de-dependencias.md), que fixa o
limite de dependências: entra `@playwright/test`, e este documento é a
justificativa que aquele ADR exige.

## Contexto

Numa única passada de trabalho, **três defeitos reais foram encontrados à mão** —
e os três passavam por `npm run lint`, `npm run typecheck` e a suíte inteira do
Vitest, que naquele momento tinha 443 casos verdes.

| Defeito | Sintoma | Quanto tempo esteve lá |
|---|---|---|
| A camada das telas capturava o ponteiro | a roda não dava zoom **em lugar nenhum** do mapa; o clique no vazio não fechava o painel; o clique que marca a origem não marcava | desde o ADR 0018 |
| A guarda `isStyleLoaded()` rejeitava os eventos de estilo | pins, traçado e postos **sumiam ao trocar de tema** e não voltavam | desde o ADR 0016, que registrou a correção que não funcionou |
| O bilhete de chegada deixou de ser emitido | o app abria com a câmera **inclinada em 55°**, numa aplicação onde a rotação está desligada e não há gesto que endireite | desde a entrada trocar sobrevoo por passeio |

Nenhum deu erro. Nenhum apareceu em console. Todos foram descobertos porque
alguém abriu um navegador para conferir outra coisa.

O padrão é claro e não é sobre disciplina: **todo teste deste repositório é de
função pura.** É uma escolha boa — `haversineKm`, `filterPlaces`,
`planRefuelStops` e a paleta são testados sem montar DOM nenhum, e é isso que
mantém a suíte em menos de um segundo. Mas nenhum deles pode responder se o
ponteiro chega ao canvas, porque isso não é uma função: é o produto de pé.

## Decisão

**Entra um teste de fumaça em Playwright, e ele é estreito de propósito.**

`npm run smoke`, sete casos, `e2e/fumaca.spec.ts`.

### O que ele cobre, e por quê

**Cada caso nasceu de um defeito real.** Não há caso escrito por imaginação. O
arquivo é a passada manual que vinha sendo feita a cada entrega, escrita uma vez.

O que ele **não** faz, e não deve passar a fazer: conferir texto, espaçamento,
cor, ou o comportamento de qualquer coisa que uma função pura já consiga provar.
Isso é trabalho do Vitest, e duplicá-lo aqui compraria lentidão e instabilidade
em troca de nada.

### Roda à mão, e não em integração contínua

Ele depende de Supabase configurado, de chave do MapTiler, de uma sessão e de um
servidor de desenvolvimento de pé. Fingir que isso cabe num gatilho de push
exigiria segredos no CI e um banco de teste — uma infraestrutura inteira para
sete casos que hoje se roda em um minuto antes de entregar.

`retries: 0`, deliberadamente: um teste de fumaça que passa na terceira tentativa
está dizendo que o produto falha um terço das vezes, e repetir transformaria essa
informação em silêncio.

### O gancho no `MapCanvas`

O mapa desenha em WebGL. Fonte, camada, inclinação e rumo **não existem no DOM**,
e nenhum seletor os alcança. Os três defeitos acima vivem exatamente nesse ponto
cego.

Então `MapCanvas` expõe a instância em `window.__rastroMap`, atrás de **dois
portões** — o mesmo desenho de `/entrar-dev`, e pela mesma razão:

1. `NODE_ENV` de produção. `next build` resolve a condição para falso e o
   empacotador remove a linha.
2. `NEXT_PUBLIC_RASTRO_E2E`, que vive só no `.env.local`, ignorado pelo git.

**Não é uma API.** Nada do produto lê `__rastroMap`, e apagar a linha não muda
comportamento nenhum. É uma porta de inspeção, e ela está documentada onde está
para não virar folclore.

### Provar que a rede pega

Um teste que passa não prova que ele pegaria o defeito. Antes de entregar, cada
uma das três correções foi **revertida de propósito** e a suíte foi rodada:

- ponteiro revertido → três casos falharam;
- guarda `isStyleLoaded()` reintroduzida → o caso de tema falhou;
- `markArrival()` comentado → **o caso da câmera passou**.

O terceiro é o que justifica este parágrafo existir. A primeira versão daquele
caso entrava no app por `page.goto`, que é carga completa de documento: o mapa é
destruído e o novo nasce plano por construção. E entrava pelo Explorar, onde o
passeio usa a câmera de instrumento e endireita o mapa sozinho. **Duas máscaras
sobre o mesmo defeito**, e o teste teria ido para o repositório provando nada.

Corrigido — entrada pelo botão, que preserva a árvore, e destino sem passeio — o
caso falhou com `Received: 55.00000000000001`.

**A regra que fica: um caso novo aqui só vale depois de ter falhado na presença
do defeito que ele existe para pegar.**

## Consequências

- **Uma dependência de desenvolvimento a mais**, e nenhuma de produção. O pacote
  não entra no que é entregue ao navegador.
- **O `.env.local` de quem desenvolve ganha uma linha.** Sem ela, `npm run smoke`
  falha no primeiro caso dizendo exatamente o que acrescentar — e não com um erro
  obscuro sobre `undefined`.
- **A definição de concluído do `CLAUDE.md` não mudou.** `smoke` não entra na
  lista obrigatória: ele depende de ambiente, e uma etapa que não roda em toda
  máquina não pode bloquear entrega. Rode-o antes de mexer no mapa, na entrada ou
  em qualquer camada.
- **O teste não cobre a entrada por conta Google nem o caminho de visitante que
  grava.** O caso da câmera usa "entrar sem conta" e cria uma sessão anônima por
  execução — descartável por desenho (ADR 0017), mas é escrita, e é a única do
  arquivo.

## Gatilho de revisão

Se um caso aqui ficar instável, a resposta **não** é `retries`. É descobrir se o
instável é o caso ou o produto — e das duas vezes em que isso foi confundido
neste projeto, era o produto.
