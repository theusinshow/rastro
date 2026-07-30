# 0013 — OpenRouteService para o traçado da estrada

**Adiciona** uma dependência externa de serviço. **Não altera** o
[ADR 0001](./0001-stack-e-limite-de-dependencias.md): nenhum pacote novo entra no
`package.json` — é uma chamada HTTP a um serviço, atrás de uma interface de uma
função.

## Contexto

O Rastro passa a montar roteiros. A escolha e a ordem das paradas são domínio
próprio (`src/domain/itinerary.ts`), mas desenhar a linha que segue a estrada de
verdade exige uma malha viária roteável, que não temos.

A alternativa é a estimativa que já existe: linha reta vezes o
`ROAD_SINUOSITY_FACTOR` de 1,35. Ela erra em serra, que é justamente onde este
produto vive — ver Consequências.

## Decisão

Usar o **OpenRouteService** para obter geometria, distância e duração reais, atrás
da interface `RoutingClient`, que tem **uma função** e devolve `null` como única
forma de falha.

## Motivos

- **2.000 requisições/dia no plano gratuito.** Uma pessoa planeja um punhado de
  viagens; a cota nunca será tocada.
- **Devolve GeoJSON nativamente**, que cai direto em `trips.route_geojson` e numa
  fonte do MapLibre sem conversão. Verificado contra a API real: `features[0]` traz
  `geometry.type: 'LineString'` e `properties.summary.{distance,duration}`.
- **Dados OpenStreetMap**, a mesma origem dos tiles do MapTiler que já usamos.
- **Não amarra a qual mapa se desenha por cima.**

## Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| Mapbox Directions | Há indício de que os termos proíbem usar o resultado sobre mapa de outro fornecedor, e desenhamos em MapTiler. **NÃO VERIFICADO** — ver Pendências. Descartada também por não ser necessária: o ORS resolve. |
| Servidor de demonstração do OSRM | Declaradamente não é para produção. |
| OSRM auto-hospedado | Operar malha viária própria para um app pessoal é desproporcional. |
| Endpoint de otimização do provedor | Ordenaria as paradas por **distância**. A ordem que interessa aqui é por **interesse**, e isso é regra de negócio — tem de viver em `src/domain/`, não numa API de terceiro. |

## Consequências

- **A chamada é sempre do servidor.** `OPENROUTESERVICE_API_KEY` **sem** o prefixo
  `NEXT_PUBLIC_`.
- **Sem a chave o produto funciona.** `getRoutingClient()` devolve `null` e a
  viagem é salva com os números estimados.
- **`route_geojson is null` é o sinalizador de "este número é estimado".** Nenhuma
  coluna nova, e a interface é obrigada a dizer qual dos dois o usuário está vendo
  — pelo mesmo princípio que impede apresentar dado de `src/mocks/` como
  verificado.
- **Sem cache de rota.** A cota não será tocada; inventar chave de cache seria
  complexidade sem comprador.

### O raio de encaixe precisa ser generoso

O provedor encaixa cada coordenada na estrada mais próxima dentro de **350 m** por
padrão, e recusa a rota **inteira** com HTTP 404 quando um único ponto cai fora
disso.

Isso não é caso raro no Rastro: a coordenada de um lugar aponta para **o lugar**,
não para a estrada que leva a ele, e mirante, cachoeira e praia costumam ficar bem
mais longe que 350 m do asfalto. Com o padrão, uma parada assim derrubaria a
viagem toda para o modo estimado, silenciosamente.

Por isso o cliente envia `radiuses` de **5.000 m** por ponto. Verificado contra a
API real: um ponto de serra a mais de 350 m de estrada devolve `404` com
`code: 2010` no padrão, e `200` com este raio.

O custo é que uma parada muito isolada pode encaixar num trecho de estrada a
alguns quilômetros dela, e o traçado passa a refletir o caminho até ali, não até a
porta do lugar. É o compromisso certo: uma rota aproximada e desenhada vale mais
que nenhuma rota.

### O fator de sinuosidade de 1,35 é otimista

Primeira medição real, Palhoça → região da Serra do Rio do Rastro → Palhoça:

| | Valor |
|---|---|
| Linha reta, ida e volta | ~176 km |
| Estimativa do `discovery.ts` (× 1,35) | ~238 km |
| **Estrada real, medida pelo ORS** | **381 km** |
| Fator implícito | **2,17** |

**Um ponto de dado não calibra uma constante**, e este raio de 5 km pode ter
inflado a medida. Mas o comentário do próprio `ROAD_SINUOSITY_FACTOR` já previa
isto — *"em serra o valor real é maior"* —, e a diferença é grande demais para
ficar sem registro: o `/descobrir` provavelmente diz que cabe no sábado uma volta
que não cabe.

Não mudamos a constante agora, porque mudá-la com um único ponto seria trocar um
palpite por outro. O gatilho está na spec §4.4 e vale para os dois modelos de
tempo: com algumas dezenas de viagens salvas com `route_geojson` preenchido, dá
para calibrar `ROAD_SINUOSITY_FACTOR` e `MINUTES_PER_STOP` com dado.

## Pendência

- [ ] Ler os termos da Mapbox Directions API e registrar aqui o que eles de fato
      dizem. A afirmação acima veio de conversa e **não foi verificada**. Não muda
      a decisão, mas não deve ser repetida como fato.

## Gatilho de revisão

Se o traçado passar a ser pedido em volume — importação em lote, recálculo a cada
edição de parada — a cota volta à mesa e o cache deixa de ser complexidade sem
comprador.
