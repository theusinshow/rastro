# Viagens — spec

> Desenhado em 29 e 30 de julho de 2026. Design aprovado pelo dono do produto.
> Próximo passo: plano de implementação.

Registrar e planejar o passeio de um dia, fechando o ciclo até o mapa: uma viagem
concluída vira visita registrada, e o mapa se preenche sozinho.

---

## 1. O que já existe

**Isto não é greenfield.** A exploração encontrou o seguinte escrito e nunca usado:

| Onde | O que já existe |
|---|---|
| `migrations/0001` | `trips`, `trip_stops`, `trip_photos`, com RLS por tabela |
| idem | `trips.route_geojson jsonb` — o traçado, já previsto |
| idem | `place_visits.trip_id` — a visita já sabe qual viagem a criou |
| idem | `trip_stops_via_trip` — posse herdada da viagem, sem `user_id` próprio |
| `src/domain/trip.ts` | `Trip`, `TripStop`, `TripStatus`, `TripStopKind` — **nenhum import** |
| `src/domain/discovery.ts` | `TimeBudget`, `estimateRoadKm` (1,35), `estimateRidingMinutes` (55 km/h), `RIDING_TIME_RATIO` (0,75), `findDestinations`, `suggestBroaderQuery` |
| `src/components/ui/InlineMessage.tsx` | O veículo de erro no painel, em uso em cinco telas |
| `src/app/(app)/viagens/page.tsx` | Stub: "entra numa próxima etapa" |

A migration 0001 já está aplicada. `PlaceUserState.photoCount` é contrato sem
trigger — mente hoje e continua mentindo até a spec de Fotos.

## 2. Escopo

**Dentro:** propor, montar, salvar e concluir um passeio de **um dia** que sai da
origem do perfil e volta para ela. Traçado real da estrada. Conclusão gerando
`place_visit` para as paradas confirmadas.

**Fora, e por quê:**

| Fora | Motivo |
|---|---|
| Navegação curva a curva | É do Google Maps, que faz melhor. O roteiro sai daqui como link com waypoints. |
| Viagem de vários dias | Introduz etapa como entidade, pernoite e "quanto rodo por dia". Spec própria. As tabelas já aguentam. |
| Vínculo com moto | `motorcycles` só existe como mock e tipo. Sem repositório, sem action, sem tela — seletor sem cadastro é campo morto. `motorcycleId` nasce `null`. |
| Estado `ongoing` | Reservado no enum. "Iniciar viagem" sem rastreamento ao vivo não paga nada. |
| Fotos | Spec B, depende desta. |
| Importar lugares | Spec C, e é problema de dados, não de interface. |

## 3. Decisões fechadas

### 3.1 O Rastro escolhe as paradas; o Google traça o caminho

O `CLAUDE.md` recusa funcionalidade que sirva melhor ao Google Maps, e "propor
rotas" era candidato direto. A tensão se resolve separando duas coisas:

- **Traçar o caminho** curva a curva, com trânsito e recálculo — é do Google.
  Competir ali é entregar versão pior do que todo mundo tem no bolso.
- **Escolher as paradas** — *"tenho sábado e 300 km; quais dos meus lugares
  encadeiam numa volta que valha a pena?"*. O Google **não consegue** responder:
  ele não sabe onde você esteve, o que marcou como quero-conhecer, nem o que
  avaliou com 5. É informação exclusiva do Rastro.

### 3.2 Traçado real, com provedor externo

Escolha explícita do dono do produto entre três níveis. Consequência aceita:
entra dependência relevante, que exige ADR. **OpenRouteService** — 2.000
requisições/dia no gratuito, dados OpenStreetMap, devolve GeoJSON pronto para
`route_geojson` e para o MapLibre sem conversão, e não amarra a qual mapa se
desenha por cima.

### 3.3 Ciclo fechado, com confirmação

Uma viagem é **um objeto atravessando estados**, não três entidades. Ao concluir,
o usuário **confirma quais paradas aconteceram** — todas vêm marcadas, ele
desmarca o que não rolou. Só as confirmadas viram `place_visit`.

Custa um passo, e é o passo que impede o mapa de afirmar que você esteve onde não
esteve. Roteiro planejado raramente acontece exatamente como planejado, e memória
contaminada por intenção é pior que memória incompleta.

### 3.4 Três entradas, um motor

1. **Propor a volta inteira** — `anchorPlaceId: null`
2. **Fixar o destino, sugerir o caminho** — âncora preenchida; continua de onde o
   `/descobrir` para
3. **Montar no dedo** — ignora a seleção, usa só ordenação e medição

## 4. Domínio — `src/domain/itinerary.ts`

TypeScript puro. Sem React, sem fetch. A regra que organiza tudo:

> **Seleção é por interesse. Ordenação é por distância.**

Juntar as duas é o erro do otimizador genérico, que minimiza quilômetro e não
sabe o que te interessa.

### 4.1 Pontuação de interesse

```ts
export const SCORE_WANTS_TO_VISIT = 100
export const SCORE_UNVISITED = 60
export const SCORE_VISITED = 20
export const SCORE_FAVORITE_BONUS = 25
/** Máximo que a idade da última visita soma a um lugar já visitado. */
export const SCORE_STALENESS_MAX = 30
/** A partir daqui a visita é "antiga" e o bônus satura. */
export const STALENESS_SATURATION_MONTHS = 24

/** `today` no formato `YYYY-MM-DD`, data civil — nunca um `Date`. */
export function scorePlace(place: ExplorePlace, today: string): number
```

Voltar a um lugar tem valor, e voltar a um lugar que você não vê há dois anos tem
mais. `lastVisitedAt` já vive em `ExplorePlace`, então a recência sai de graça.

`today` entra como parâmetro, não como `new Date()` dentro da função — é o que
mantém a função pura e testável. E é `string` de data civil pelo mesmo motivo do
`dates.ts`: `Date` arrasta fuso para dentro de uma conta que é de calendário.

### 4.2 Ordenação

Vizinho-mais-próximo desde a origem, depois **2-opt** sobre o ciclo fechado
(origem → paradas → origem) até não haver melhora. Poucas dezenas de candidatos,
microssegundos, ~15 linhas.

### 4.3 O laço que faz caber

1. seleciona os `maxStops` melhores por pontuação
2. ordena geometricamente, soma os trechos
3. estourou o orçamento → **descarta a de menor pontuação** e volta ao 2
4. **a âncora nunca é descartada.** Se só ela já não cabe, o roteiro é recusado
   dizendo qual limite estourou

### 4.4 Orçamento de tempo — e uma divergência declarada

O `RIDING_TIME_RATIO` de 0,75 foi calibrado para **um destino**: ele reserva 25%
do tempo para tudo que não é pilotar. Isso não generaliza — cinco paradas custam
mais tempo parado que uma, e a proporção não é a mesma.

Então o itinerário usa um modelo explícito:

```ts
/** Foto, café, esticar as pernas, combustível. Por parada. */
export const MINUTES_PER_STOP = 30

// orçamento de pilotagem = TIME_BUDGET_MINUTES[budget] - paradas * MINUTES_PER_STOP
```

**Isto é uma segunda régua, e é divergência consciente.** O `/descobrir` continua
com 0,75 porque mudá-lo alteraria comportamento já calibrado, sem dado que
justifique. Os dois modelos discordam: para um destino em 4 horas, o ratio reserva
60 minutos e o novo modelo reserva 30.

**Gatilho para reconciliar:** esta própria feature passa a produzir viagens reais
com `started_at`, `ended_at` e `distance_km` medidos. Com algumas dezenas
registradas, dá para calibrar uma régua só com dado em vez de palpite. Registrar a
divergência agora é mais honesto que escolher um número e fingir que foi medido.

### 4.5 Tipos

```ts
export interface ItineraryRequest {
  origin: Coordinates
  timeBudget: TimeBudget
  maxDistanceKm: number
  categories: PlaceCategory[]
  anchorPlaceId: string | null
  maxStops: number
}

export interface ItineraryLeg {
  /** Índice da parada de onde o trecho sai; -1 é a origem. */
  fromStopIndex: number
  roadKm: number
  minutes: number
}

export interface Itinerary {
  stops: ExplorePlace[]        // já na ordem de rodagem
  legs: ItineraryLeg[]         // inclui o trecho de volta à origem
  totalRoadKm: number
  totalRidingMinutes: number
}

/**
 * As três recusas são distintas e rendem mensagens diferentes. Confundi-las
 * devolveria ao usuário o trabalho de descobrir o que deu errado.
 */
export type ItineraryRefusal =
  /** Nada passou pelos filtros de categoria e raio. Nem chegou a medir tempo. */
  | 'no-candidates'
  /** Passou pelos filtros, mas nem a parada mais próxima cabe no tempo. */
  | 'budget-too-small'
  /** Só a âncora, sozinha, já estoura o orçamento. */
  | 'anchor-does-not-fit'

export function buildItinerary(
  places: readonly ExplorePlace[],
  request: ItineraryRequest,
  today: string,
): Itinerary | { refusal: ItineraryRefusal }

/** Para o modo "montar no dedo": ordena e mede um conjunto já escolhido. */
export function orderAndMeasure(
  origin: Coordinates,
  stops: readonly ExplorePlace[],
): Itinerary
```

## 5. Ciclo de vida

| Estado | Significa |
|---|---|
| `planned` | Paradas ordenadas, talvez traçado. Nenhuma visita registrada. |
| `completed` | Paradas confirmadas. Cada confirmada gerou `place_visit` com `trip_id` de volta. |
| `ongoing` | Reservado. Fora da v1. |

### A regra de honestidade

**`route_geojson is null` É o sinalizador de que o número é estimado.** Nenhuma
coluna nova: se o traçado veio do ORS, `distance_km` é medido; se não veio, é o
fator 1,35 chutando.

E isso **aparece na tela**. O produto já se recusa a apresentar dado não
verificado como verificado — distância estimada por sinuosidade não é distância
medida em malha viária, e a interface diz qual das duas você está olhando.

## 6. Camadas e arquivos

A regra é verificável lendo imports (tabela do `CLAUDE.md`).

| Arquivo | Importa | Papel |
|---|---|---|
| `src/domain/itinerary.ts` | só `domain` | O motor da seção 4 |
| `src/domain/itinerary.test.ts` | — | Testes puros |
| `src/lib/routing/routing-client.ts` | só `domain` | Interface do roteamento |
| `src/lib/routing/open-route-service.ts` | só `domain` | A única implementação |
| `src/lib/data/trip-repository.ts` | `domain` | Contrato |
| `src/lib/data/supabase/trip-row.ts` | `domain` | Tradução linha↔domínio, com testes |
| `src/lib/data/supabase/supabase-trip-repository.ts` | `domain`, `lib/supabase` | Adapter |
| `src/app/actions/trip-actions.ts` | `domain`, `lib` | Fronteira de escrita |
| `src/components/trips/*` | `domain`, `lib` | Painel, lista, editor |
| `src/lib/map/trip-route-layers.ts` | `domain` | As duas camadas de linha |

**Nenhum repositório recebe `userId`** — `trips_own` filtra por `auth.uid()` e
`trip_stops_via_trip` herda a posse. ADR 0008 intacto.

A Server Action **orquestra**: monta o itinerário (domínio), pede o traçado
(`lib/routing`), persiste (`lib/data`), revalida. Nenhuma regra de negócio nela.

## 7. A fronteira externa é um buraco de agulha

```ts
export interface RoutedLine {
  geometry: GeoJSON.LineString
  roadKm: number
  minutes: number
}

export interface RoutingClient {
  /** `null` quando não foi possível rotear. NUNCA lança. */
  route(points: readonly Coordinates[]): Promise<RoutedLine | null>
}
```

Uma função, um retorno, e `null` como única forma de falha. **O modo degradado é
um `if`, não um segundo caminho de código.**

Chave em `OPENROUTESERVICE_API_KEY` — **sem** `NEXT_PUBLIC_`, que é o ponto todo:
a chamada só acontece no servidor. Sem a chave, o produto roda em modo estimado,
como a tela de login já faz quando o Supabase não está configurado.

**Sem cache de rota, deliberadamente.** São 2.000 requisições/dia e uma pessoa
planeja um punhado de viagens. Inventar chave de cache para poupar cota que não
será tocada é complexidade sem comprador.

## 8. Migration 0003 — a escrita atômica

Concluir escreve em **duas tabelas**: `trips` (status, `ended_at`) e
`place_visits` (uma linha por parada confirmada). Em dois `await` separados, falha
no meio deixa o banco mentindo — e como é o registro de visita que pinta o mapa,
a inconsistência fica **visível**.

`migrations/0003_complete_trip.sql`: função Postgres **`security invoker`** que
faz as duas escritas numa transação. `security invoker` importa — a RLS continua
valendo dentro dela e o banco segue sendo a autoridade de autorização. O trigger
que mantém `visit_count` e `last_visited_at` dispara naturalmente.

Não é mudança de esquema, mas é migration.

### A armadilha da data

`place_visits.visited_at` é `date`; `trips.ended_at` é `timestamptz`. Converter no
fuso errado registra a visita no dia anterior — mordida que o `dates.ts` **já
documenta**, porque já aconteceu neste repositório com `new Date('2026-07-26')`.

Conversão num lugar só, com teste, no fuso de quem viajou. Nunca UTC.

## 9. Interface

### 9.1 A rota desenhada é a marca virando dado

A marca do Rastro **é** uma estrada: traço âmbar com faixa central tracejada na
cor do fundo. O traçado no mapa é desenhado exatamente assim — duas camadas de
linha, âmbar por baixo, tracejado da cor da superfície por cima.

É o único lugar onde a geometria da identidade vira informação literal. E resolve
de brinde a leitura: a rota fica distinta das vias do mapa base (osso, `#c2b9a7`)
sem competir com os pins, que são círculos.

Hex literal espelhando a paleta — MapLibre não lê variável CSS (ADR 0009, 0012).

### 9.2 A ordem é calculada, não arrastada

Você escolhe **quais** paradas; a ordem sai do 2-opt.

Arrastar é ruim com luva e ruim para leitor de tela; setinhas exigiriam glifo, que
o ADR 0009 só libera na navegação; e o motor já ordena melhor que a mão.

### 9.3 Telas

Tudo em painel flutuante sobre o mapa, por ADR 0010. Linhas separadas por
hairline, sem card. Números em `.instrument-value`.

| Rota | O que é |
|---|---|
| `/viagens` | Lista: título, data, km em mono, status |
| `/viagens/nova` | Proposta: orçamento, categorias, âncora opcional. Gramática do `/descobrir` |
| `/viagens/[slug]` | Roteiro: paradas em ordem, trechos em mono, traçado no mapa, abrir no Google, concluir |
| `/viagens/[slug]/concluir` | Confirmação de paradas: todas marcadas, você desmarca |

## 10. Erros — todos no painel, nenhum em toast

| Situação | O que aparece |
|---|---|
| `no-candidates` — nada passou pelos filtros | `suggestBroaderQuery`, que já existe: qual limite ampliar e quantos destinos isso devolveria |
| `budget-too-small` — passou pelos filtros, nada cabe no tempo | Diz que o problema é o tempo, não o raio nem a categoria. Ampliar o raio aqui pioraria |
| `anchor-does-not-fit` — só a âncora já estoura | Nomeia o destino e diz de quanto tempo ele precisaria. Nunca lista vazia |
| ORS falhou / sem chave / fora da cota | **Nada quebra.** Salva com números estimados, e o painel diz que é estimativa |
| Concluir sem confirmar parada nenhuma | Permitido. Você rodou e tudo estava fechado — é um fato |

## 11. Verificação e definição de concluído

**`lint`, `typecheck` e os 121 testes não desenham o mapa.** Nesta sessão os pins
foram declarados verificados com os três limpos mais um teste de GeoJSON, e os 14
estavam **invisíveis** — expressão de zoom aninhada que o MapLibre rejeitava em
silêncio.

Para esta feature, "pronto" **exige captura de tela**. O laço de Playwright entra
na definição de concluído.

- [ ] `itinerary.test.ts`: pontuação, recência, 2-opt melhorando de fato, poda por
      orçamento, âncora nunca descartada, recusa quando só a âncora não cabe
- [ ] `trip-row.test.ts` nos dois sentidos, como `place-row.test.ts`
- [ ] **Um teste só para a conversão de data**, com caso às 23h de Brasília
- [ ] **Prova de RLS da `complete_trip`**: demonstrar que um usuário não conclui a
      viagem de outro. `docs/VERIFICACAO-RLS.md` existe e **nunca foi executado**
      neste projeto — entra aqui
- [ ] Captura de tela do traçado no mapa, em 1512 e 390
- [ ] `npm run lint`, `npm run typecheck`, `npm test` limpos
- [ ] ADR do OpenRouteService
- [ ] `CHANGELOG.md`

## 12. Omissões deliberadas, com gatilho

| Omitido | Gatilho para voltar |
|---|---|
| Fixar uma parada como primeira ("a serra de manhã, que é mais fria") | Se a ordem calculada incomodar no uso real. É barato: a âncora já existe no `ItineraryRequest` |
| Nota pessoal na pontuação | `rating` vive em `PlaceUserState` e **não** é achatado em `ExplorePlace`. Adicioná-lo repercute em `toExplorePlace`, nos repositórios e nas fixtures — que já quebraram três vezes nesta sessão por exatamente isso. Entra quando houver outro motivo para tocar nesse modelo |
| Cache de rota | Cota de 2.000/dia nunca será tocada |
| Régua única de tempo | Ver 4.4: precisa de dado real, que esta feature vai começar a produzir |

## 13. Pendência não verificada

- [ ] **Termos do Mapbox.** Foi afirmado em conversa que a Directions API do
      Mapbox proíbe usar o resultado sobre mapa de outro fornecedor, o que a
      descartaria por desenharmos em MapTiler. **Não foi verificado.** Não muda a
      escolha — o ORS ganha por outros motivos — mas não deve ser repetido como
      fato até alguém ler os termos.
