# Viagens — design (em andamento)

> **Estado: brainstorming interrompido no passo 4 de 8.** As decisões abaixo
> estão fechadas com o dono do produto. O que falta é apresentar o design em
> seções, escrever a spec final, revisar e gerar o plano de implementação.
>
> Retomar por: *"apresentar o design"* — as quatro decisões desta página não
> precisam ser rediscutidas.

---

## O achado que mudou a conversa

**Isto não é greenfield.** Antes de propor qualquer coisa, a exploração
encontrou o seguinte já escrito e nunca usado:

| Onde | O que já existe |
|---|---|
| `supabase/migrations/0001` | Tabelas `trips`, `trip_stops`, `trip_photos`, com RLS própria por tabela |
| idem | Coluna `trips.route_geojson jsonb` — o traçado, já previsto |
| idem | Colunas `latitude`, `longitude`, `taken_at`, `exif` em `trip_photos`, esperando EXIF |
| `src/domain/trip.ts` | `Trip`, `TripStop`, `TripPhoto`, `TripStatus`, `TripStopKind` — tipados, **nenhum import em lugar nenhum** |
| `src/domain/discovery.ts` | Orçamento de tempo, `ROAD_SINUOSITY_FACTOR = 1.35`, `RIDING_TIME_RATIO = 0.75`, `findDestinations` |
| `src/app/(app)/viagens/page.tsx` | Stub: um painel dizendo "entra numa próxima etapa" |

A migration 0001 já foi aplicada no banco. O trabalho é **ativar um projeto já
desenhado**, não inventá-lo.

Ponto de atenção: `PlaceUserState.photoCount` está documentado como contrato sem
trigger. Hoje ele mente, e vai continuar mentindo até a spec de Fotos.

---

## Decomposição — três subsistemas, três specs

O pedido original foi "propor rotas, pegar imagens, mais lugares". São três
projetos independentes e não cabem numa spec só.

| | O que é | Depende de | Estado |
|---|---|---|---|
| **A. Viagens** | Encadear paradas, salvar, registrar o que rolou | Nada — as tabelas existem | **Esta spec** |
| **B. Fotos** | Upload, Storage, galeria, EXIF, `photoCount` de verdade | Uma viagem ou lugar onde pendurar | Depois |
| **C. Mais lugares** | Problema de **dados**, não de feature | Nada | Depois, e talvez nem seja código |

Sobre C: os 14 lugares de hoje são mock declarado em `src/mocks/`, marcados como
não verificados. "Mais lugares" ou é cadastro à mão — que **já funciona** — ou é
importação externa, e aí a pergunta vira *de qual fonte, sob qual licença, e como
não poluir o catálogo compartilhado com dado que ninguém conferiu*. É uma
conversa de dados, não de interface.

---

## Decisões fechadas

### 1. O Rastro escolhe as paradas; o Google não é concorrente aqui

O `CLAUDE.md` diz que funcionalidade que serve melhor ao Google Maps não pertence
a este produto, e "propor rotas" era candidato direto. A tensão se resolve
separando duas coisas que a frase juntava:

- **Traçar o caminho** curva a curva, com trânsito e recálculo — é do Google, que
  faz melhor, e competir ali é entregar uma versão pior do que todo mundo já tem
  no bolso.
- **Escolher as paradas** — *"tenho sábado e uns 300 km; quais dos meus lugares
  encadeiam numa volta que valha a pena?"*. O Google **não consegue** responder,
  porque não sabe onde você já esteve, o que marcou como quero-conhecer, nem o
  que avaliou com 5. É informação exclusiva do Rastro.

**Decisão:** o Rastro decide *quais* paradas e em que ordem. A navegação
propriamente dita continua sendo do Google — o roteiro sai daqui como link com os
waypoints.

### 2. Traçado real da estrada, com provedor externo

Escolha do dono do produto entre três níveis (só paradas com linha reta / paradas
mais traçado real / navegação completa). **Escolhido: paradas + traçado real.**

Consequência aceita explicitamente: entra uma dependência externa relevante, o
que exige ADR pelo `CLAUDE.md`. A navegação segue fora de escopo.

### 3. Ciclo fechado: planejar → concluir → virar memória

O schema já modela `status` como `planned → ongoing → completed`: uma viagem é
**um objeto só atravessando estados**, não três entidades.

**Decisão:** ao marcar uma viagem como concluída, cada parada que é lugar do
catálogo vira um `place_visit`. Essa tabela já existe, já tem trigger que
atualiza `visitCount` e `lastVisitedAt`, e já é o que pinta o pin no mapa.

O efeito é que **o mapa se preenche sozinho depois que você roda** — que é
literalmente a frase do `CLAUDE.md`: *"o mapa é a memória visual da vida do
motociclista"*. Sem esse fechamento, o que se constrói é um planejador de rotas
que por acaso mora num app de moto.

### 4. Bate-e-volta de um dia; multi-dia vira spec própria

O `discovery.ts` já assume ida e volta a partir da origem do perfil, cortando
pelo orçamento de horas. Multi-dia introduz etapa como entidade, pernoite e
"quanto eu rodo por dia" — outro domínio e outra interface.

As tabelas aguentam os dois (`started_at`/`ended_at` são `timestamptz`), então
não há retrabalho ao adiar.

### 5. Três entradas, um motor

Escolhidas **as três**:

1. **O Rastro propõe a volta inteira** — "sábado, 6 horas, serra e cachoeira" →
   volta pronta com 3 a 5 paradas, priorizando quero-conhecer e não-visitado.
2. **Você fixa o destino, ele sugere o caminho** — continua de onde o
   `/descobrir` para hoje.
3. **Você monta no dedo** — o escape que sempre precisa existir.

São o mesmo motor com uma **âncora opcional**. Em qualquer um dos três o
rascunho é editável.

Onde vive: painel flutuante sobre o mapa, por ADR 0010. Não é tela separada.

---

## Abordagem recomendada — aguardando aprovação

A pergunta arquitetural é *onde mora a decisão de quais paradas e em que ordem*.

**Recomendada: motor de encadeamento próprio; o provedor só desenha a estrada.**

- Escolha e ordem viram `src/domain/itinerary.ts`, TypeScript puro, estendendo o
  `discovery.ts`. Com algumas dezenas de candidatos, vizinho-mais-próximo seguido
  de 2-opt resolve em microssegundos e cabe em poucas dezenas de linhas
  testáveis. Zero dependência para a parte que é regra de negócio.
- O provedor externo é chamado **uma vez por roteiro**, só para a geometria da
  estrada e os km/minutos reais, e o resultado é gravado em `route_geojson`.
  Nunca se pede a mesma rota duas vezes.

**Descartada: delegar a ordenação ao provedor.** ORS e GraphHopper têm endpoint
de otimização, mas ele otimiza **distância** — e a ordem que interessa aqui é por
*interesse*: quero-conhecer antes de já-visitado, nota 5 antes de nota 3. Isso é
exatamente o que o Rastro sabe e o otimizador não. Além de tirar regra de negócio
do domínio, contra o `CLAUDE.md`.

**Obrigatório de qualquer forma: modo degradado.** Quando a chave faltar ou a API
cair, o roteiro continua funcionando com a estimativa de sinuosidade de 1,35 que
já existe. Roteiro que quebra porque uma API de terceiro caiu não é aceitável.

### Provedor: OpenRouteService

- 2.000 requisições/dia no plano gratuito — ordens de grandeza acima do uso real.
- Dados OpenStreetMap; devolve GeoJSON pronto para cair em `route_geojson` e numa
  fonte do MapLibre sem conversão.
- Não amarra a qual mapa se desenha por cima.
- Chamado **sempre do servidor**, para a chave não vazar — coerente com Server
  Actions como fronteira de escrita.

---

## Pendências

- [ ] **Verificar os termos do Mapbox.** Foi afirmado nesta conversa que a
      Directions API do Mapbox proíbe usar o resultado sobre mapa de outro
      fornecedor, o que a descartaria por desenharmos em MapTiler. **Isso não foi
      verificado nesta sessão.** Não muda a recomendação — o ORS ganha por outros
      motivos —, mas não deve ser repetido como fato até alguém ler os termos.
- [ ] Aprovar a abordagem recomendada.
- [ ] Apresentar o design em seções (arquitetura, componentes, fluxo de dados,
      erros, testes).
- [ ] Escrever a spec final, auto-revisar, revisão do dono.
- [ ] ADR da dependência de roteamento.
- [ ] Invocar `writing-plans`.

## Perguntas ainda em aberto

- O estado `ongoing` entra na v1, ou uma viagem vai direto de `planned` para
  `completed`?
- Vínculo com `motorcycles` (a tabela existe) entra na v1?
- Concluir uma viagem cria `place_visit` para **toda** parada do catálogo, ou o
  usuário confirma quais realmente aconteceram? Registrar visita em lugar onde
  não se parou faria o produto mentir sobre a própria memória.
