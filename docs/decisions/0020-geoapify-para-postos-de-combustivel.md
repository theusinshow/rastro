# 0020 — Geoapify para postos de combustível, atrás de uma rota nossa

**Mantém** todos os ADRs anteriores. **Estende** o
[ADR 0005](./0005-pins-como-camadas-data-driven.md) com um mark de mapa que não
é destino, e o [ADR 0016](./0016-a-regua-diz-de-onde-veio-o-numero.md) com a
primeira leitura numérica que vem medida de fora.

## Contexto

O Rastro sabe dizer quantas paradas para abastecer uma volta exige — é o que
`planRefuelStops` faz em `src/domain/fuel.ts` desde as viagens. O que ele não
sabia dizer é **onde**. A conta terminava em "você vai precisar parar uma vez
por volta dos 255 km", e a pessoa ia procurar posto no Google Maps, que é
exatamente o movimento que o produto existe para não exigir.

Três fontes foram consideradas:

- **Overpass API (OpenStreetMap direto).** Gratuita e sem cadastro, que é o
  padrão preferido aqui (Open-Meteo, Wikimedia Commons). Recusada pela
  instabilidade das instâncias públicas e pela linguagem de consulta própria:
  seriam ~150 linhas nossas para montar e traduzir QL, contra ~40 para um
  GeoJSON já normalizado. Continua sendo a saída de emergência se a Geoapify
  virar problema.
- **Google Places.** Melhor cobertura, exige cartão de crédito e proíbe cachear
  o resultado. Fora: o produto declara o Google como quem traça o caminho, não
  como quem sabe o que existe.
- **Geoapify Places API.** Cadastro gratuito sem cartão, 3.000 créditos por dia,
  resposta em GeoJSON, dado do OpenStreetMap com atribuição explícita.
  Escolhida.

## Decisão

**A busca de postos é da Geoapify, e passa por uma rota nossa.**

```
GET https://api.geoapify.com/v2/places
    ?categories=service.vehicle.fuel
    &filter=circle:LON,LAT,RAIO
    &bias=proximity:LON,LAT
    &limit=20
```

Os quatro parâmetros foram conferidos na documentação oficial, não herdados de
exemplo antigo:

- `service.vehicle.fuel` é a folha certa da árvore de categorias. `service.vehicle`
  inteiro traria lava-jato, oficina e eletroposto junto.
- `filter=circle` **recorta**; `bias=proximity` **ordena**. Os dois são
  necessários: é o `bias` que faz o provedor devolver o campo `distance`, sem o
  qual a lista sairia em ordem arbitrária dentro de 20 km — a pergunta errada
  para quem parou no acostamento.
- Ambos recebem `longitude,latitude`, na ordem inversa da nossa.
- O teto do provedor é 500 por requisição; o nosso é 50, com 20 de padrão.

### A camada nova: `src/app/api/`

O resto do produto lê por Server Component e escreve por Server Action, e as
duas outras consultas de cliente a serviço externo — Wikimedia Commons e
geocodificação do MapTiler — são Server Actions. **Esta é uma rota**, e a
escolha não é estilística:

1. **Cancelamento.** Trocar o ponto de busca precisa abortar a consulta anterior,
   ou a resposta velha chega depois e sobrescreve a lista certa. Server Action
   não é cancelável pelo chamador.
2. **Cache por URL.** A chave é a coordenada arredondada mais raio e limite. Com
   Action, cada chamada é um POST opaco e não há o que cachear.
3. **Erro nomeado com status.** Cota estourada, credencial recusada e rede caída
   precisam chegar à interface como coisas diferentes.

A rota **já nasce protegida por sessão**: `src/proxy.ts` cobre tudo que não está
em `PUBLIC_PATHS`. Isso não é privacidade — posto é dado público — é o que
impede a cota diária de ser drenada por quem não usa o Rastro.

### A falha deixa de ser `null`

`RoutingClient` e `WeatherClient` usam `null` como única forma de falha, e está
certo lá: o modo degradado é silencioso, a viagem continua com distância
estimada. **Aqui não existe modo degradado.** Quem apertou "Postos" pediu uma
coisa só, e ou ela chega ou a pessoa precisa saber por quê para decidir se
aperta "tentar de novo" ou desiste. `FuelSearchFailure` tem sete valores, cada um
com mensagem em PT-BR e um sinalizador de se vale retentar — "sem chave" e
"parâmetro inválido" não valem, e não ganham botão.

O que **não** muda: a implementação nunca lança.

### O posto é um losango

Os pins do catálogo são discos (ADR 0005). O posto é **losango**, e a razão é a
lição medida do [ADR 0019](./0019-contraste-medido-na-paleta-do-mapa.md): dois
significados separados só por matiz chegaram a 1.19:1 um do outro, e ninguém
pegou isso na revisão. Posto não é destino — é serviço — e a distinção precisa
sobreviver a 12px, a sol na tela e a daltonismo. Silhueta sobrevive.

A imagem é rasterizada por uma função pura em `src/lib/map/fuel-icon.ts`, e não
por um `<canvas>`: assim ela é testável no mesmo ambiente `node` do domínio, e
não entra dependência nenhuma. A cor é o azul de carta náutica que a navegação
já usa em Memórias — fora da faixa quente dos três estados de visita, porque
serviço não compete com destino. O risco dessa escolha é confundir com a água, e
`palette.test.ts` agora mede exatamente isso nos dois temas.

### A distância é medida, e a régua diz isso

O provedor devolve a distância **em linha reta** entre o ponto consultado e o
posto. Ela entra com régua **sólida** e sem `~`, porque é medição de verdade — ao
contrário da distância do catálogo, que multiplica a linha reta por um fator de
sinuosidade e por isso leva régua tracejada e o prefixo. A nota do rodapé do
painel diz qual das duas é. Posto sem distância informada recebe `—` e régua
pontilhada, nunca um palpite.

### Nada busca sozinho

Não há efeito escutando o mapa, não há debounce de `drag`, não há refetch ao
mudar o zoom. Toda ida à rede sai de um gesto: ligar a camada, trocar o ponto de
referência, mudar o raio, apertar "buscar nesta área" ou "tentar de novo". O
movimento do mapa só decide se o convite **aparece**
(`movedEnoughToSearchAgain`, um quinto do raio).

Dois caches, com prazos diferentes de propósito:

| Onde | Prazo | O que economiza |
|---|---|---|
| `fetch` à Geoapify, em `geoapify.ts` | 6 h | **crédito** — compartilhado entre todos os usuários do servidor |
| memória do navegador, em `browser.ts` | 10 min | ida à rede dentro de uma sessão |

O dado é do OpenStreetMap, onde um posto em Santa Catarina muda em escala de
semanas. Encurtar as seis horas gastaria cota para receber a mesma resposta.
Nenhum Redis: o cache de dados do Next resolve, e infraestrutura nova para a
primeira versão seria o oposto do ADR 0001.

### Atribuição

Duas obrigações distintas, as duas no rodapé do painel enquanto a camada existe,
e as duas também no corpo da resposta do endpoint — para que um consumidor futuro
receba a obrigação junto do dado:

1. **ODbL 1.0**, do OpenStreetMap: `© OpenStreetMap contributors`, com link para
   `openstreetmap.org/copyright`.
2. **Plano gratuito da Geoapify**: crédito ao provedor com link seguível. Por
   isso esse link leva `rel="noopener"` sem `noreferrer`.

A atribuição do **mapa** (MapTiler e OpenStreetMap) continua onde sempre esteve,
no controle do MapLibre. Nada aqui a substitui.

## Consequências

- **Sem `GEOAPIFY_API_KEY`, o botão continua na tela** e diz que a busca não está
  configurada ao ser apertado — o mesmo desenho do MapTiler e do Supabase
  ausentes: estado explícito, nunca falha silenciosa.
- **Posto não entra em `places`.** Não tem visita, não tem favorito, não vira
  memória, não entra em roteiro. É consulta a serviço externo, não entidade do
  Rastro — por isso o estado vive em React e **não na URL**, ao contrário dos
  filtros (ADR 0006): guardá-lo na URL prometeria que um link devolveria a mesma
  lista, e a lista depende de cota, de horário e do OpenStreetMap de hoje.
- **Um painel por vez do lado direito.** O lugar escolhido tem precedência sobre
  a lista de postos; fechá-lo devolve a lista, com os losangos ainda no mapa.
- **"Traçar rota até aqui" é o Google**, como toda rota deste produto. A
  fronteira declarada não muda: o Rastro escolhe a parada, o Google traça o
  caminho.
- **Um `console.error` deliberado** na rota, o único do projeto. Uma falha de
  integração que vira mensagem amigável some sem deixar rastro, e a diferença
  entre "a chave expirou" e "a Geoapify caiu" só aparece no log. Nunca inclui a
  chave nem a URL montada.

## Pendência

- [ ] Postos **ao longo da rota**, e não só em volta de um ponto. A estrutura
      está pronta: `FuelQuery` é um centro mais um raio, e uma busca por
      corredor é uma sequência de consultas ao longo de `RoutedLine.geometry`
      com dedupe por `place_id` — mais `pointAtDistance` de `fuel.ts`, que já
      sabe onde o tanque acaba. Nada no desenho atual impede.
- [ ] Filtro por combustível disponível e por 24 horas. O provedor aceita
      `conditions`, e `datasource.raw` traz as tags do OSM; `FuelStation.categories`
      já guarda as categorias cruas para isso.

## Gatilho de revisão

Se a cota de 3.000 créditos por dia começar a apertar, o primeiro movimento é
alongar o cache do servidor — não encurtar o raio nem esconder o botão. Se o
provedor virar problema de disponibilidade, a saída é a Overpass API, e o
contrato `FuelStationClient` existe para que a troca seja um arquivo.
