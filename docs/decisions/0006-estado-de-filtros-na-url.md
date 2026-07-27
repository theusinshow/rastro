# 0006 — Estado de filtros na URL

## Contexto

O Explore ganhou quatro dimensões de filtro — categoria, raio em linha reta,
situação de visita e favoritos — que se somam à seleção de lugar já existente
(ADR anterior, via `useSelectedPlace`). Cinco pedaços de estado que precisam
sobreviver a navegação, recarregamento e compartilhamento.

A alternativa natural para esse tipo de estado, em qualquer aplicação React de
porte médio, é uma biblioteca de estado global (Zustand, Redux, Jotai ou
similar). O repositório já recusa essa classe de dependência deliberadamente
(ver `CLAUDE.md` e ADR 0001).

## Decisão

**A URL é a fonte única desse estado.** Nenhum estado de filtro ou seleção
mora em `useState`/contexto além do necessário para repassar um valor lido da
URL de um componente a outro (ver `visible-places-context.tsx`, que existe só
como ponte de contagem entre a página e a barra de status, não como dono de
estado de filtro).

- `useExploreFilters` lê e escreve os quatro parâmetros de filtro via
  `useSearchParams` / `router.replace`.
- `useSelectedPlace` (já existente) lê e escreve o parâmetro `place` da mesma
  forma.
- Os dois hooks preservam os parâmetros um do outro: `setFilters` parte de
  `new URLSearchParams(searchParams.toString())` antes de alterar `cat`,
  `raio`, `status` e `fav`, então nunca apaga um `place=` presente, e
  vice-versa.
- A seleção sobrevive deliberadamente à filtragem: se o lugar aberto sai do
  recorte do filtro atual, o painel continua aberto. Fechá-lo sozinho pareceria
  um bug para quem só mexeu num filtro sem intenção de fechar nada.

## Motivos

- **Zero dependências.** Nenhuma biblioteca de estado global instalada.
- **Links compartilháveis e favoritáveis.** Qualquer recorte do mapa —
  "serras a até 150 km, não visitadas" — é uma URL como qualquer outra.
- **Botão voltar funciona sem trabalho extra**, na medida em que o navegador
  já resolve isso para navegações de página inteira; ver "Consequências"
  abaixo para o limite dessa afirmação dentro de uma mesma página.
- **O estado sobrevive a refresh** porque não existe em memória — é
  recalculado a partir da URL a cada carregamento.

## Contrato de URL

```
/?cat=serra,mirante&raio=150&status=nao-visitado,quero-conhecer&fav=1&place=urubici
```

| Parâmetro | Formato | Significado quando presente | Quando ausente |
|---|---|---|---|
| `cat` | lista separada por vírgula de `PlaceCategory` | Restringe às categorias listadas | Sem restrição de categoria |
| `raio` | número positivo (km) | Restringe a lugares dentro dessa distância em linha reta da origem | Sem restrição de raio |
| `status` | lista separada por vírgula de `VisitStatus` (`nao-visitado`, `quero-conhecer`, `visitado`) | Restringe às situações listadas | Sem restrição de situação |
| `fav` | `1` | Restringe a lugares favoritos | Sem restrição de favorito |
| `place` | slug do lugar | Abre o painel do lugar correspondente | Nenhum painel aberto |

Regras que valem para todos os parâmetros:

- **Ausência significa "sem restrição"**, nunca "nenhum resultado". Listas
  vazias e `null` são tratados da mesma forma pelo domínio
  (`DEFAULT_EXPLORE_FILTERS`).
- **Valor inválido é ignorado, nunca quebra a tela.** `cat=inexistente` não
  bate com nenhuma categoria conhecida e é descartado por `parseList`;
  `raio=abc` não é um número finito positivo e vira `null` por `parseRadius`.
  A URL pode ser editada à mão por alguém sem que a aplicação quebre — o pior
  caso é o mapa mostrar tudo.
- Todos os critérios se combinam com **E**, nunca **OU** — ver
  `filterPlaces` em `src/domain/filters.ts`.

## Consequências

- Todo componente que lê ou escreve filtro ou seleção precisa de
  `useSearchParams`, e portanto ser componente de cliente (`'use client'`)
  dentro de um limite `<Suspense>` — exigência do Next.js App Router para não
  travar a pré-renderização estática da rota.
- Usamos `router.replace`, nunca `router.push`, tanto em `useExploreFilters`
  quanto em `useSelectedPlace`. Um `push` por clique de chip encheria o
  histórico do navegador com uma entrada por combinação de filtro
  experimentada, tornando o botão voltar inútil (uma dezena de cliques vira
  uma dezena de "voltar" para desfazer). Isso tem uma consequência
  explícita e aceita: o botão voltar **não** desfaz filtro por filtro dentro
  da mesma visita ao Explore — como cada mudança substitui a mesma entrada de
  histórico, voltar pula direto para a página visitada antes do Explore, não
  para o filtro anterior. A alternativa (usar `push`) foi descartada porque o
  custo — histórico poluído a cada clique de chip — pesa mais no dia a dia do
  que a conveniência ocasional de desfazer um filtro de cada vez.
- A serialização (nomes dos parâmetros, formato de lista, parsing de valores)
  precisa ser mantida manualmente em sincronia com os tipos de
  `src/domain/filters.ts` e `src/domain/place.ts`. Não há geração automática
  nem validação de schema — é código de ~80 linhas em vez de uma dependência,
  e o custo aceito é a disciplina de atualizar os dois lados juntos quando um
  tipo do domínio mudar.
