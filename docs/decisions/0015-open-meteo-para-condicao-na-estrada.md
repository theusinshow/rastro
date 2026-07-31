# 0015 — Open-Meteo para a condição na estrada

**Adiciona** uma dependência externa de serviço. **Não altera** o
[ADR 0001](./0001-stack-e-limite-de-dependencias.md): nenhum pacote novo entra no
`package.json` — é uma chamada HTTP atrás de uma interface de uma função, como o
[ADR 0013](./0013-openrouteservice-para-tracado.md) fez com o traçado.

## Contexto

A pergunta que faz alguém abrir uma viagem numa quinta-feira não é "quantos
quilômetros são?" — isso a página já responde. É **"dá para ir no fim de
semana?"**.

Em Santa Catarina essa pergunta é quase sempre sobre neblina. A Serra do Rio do
Rastro e o Morro da Igreja passam boa parte do inverno dentro da nuvem, e subir
para ver o mirante fechado é a decepção clássica de quem anda de moto na região.
Nenhum dado que o Rastro já tem responde isso.

## Decisão

Usar a **Open-Meteo** para previsão horária em cada ponto da rota, atrás da
interface `WeatherClient`, que tem **uma função** e devolve `null` como única
forma de falha.

O produto mostra **visibilidade, temperatura e chance de chuva**, entre 7h e 19h,
para os próximos três dias, ponto a ponto.

## Motivos

Tudo abaixo foi medido contra a API real antes desta decisão.

- **Sem chave e sem cadastro.** Nada a configurar, nada a guardar, nada que possa
  vazar. É a única fonte de dados do projeto sem credencial.
- **Vários pontos numa requisição só.** As cinco paradas de uma volta voltam em
  **758 ms**; um ponto isolado, em 176 ms.
- **A visibilidade discrimina de verdade.** Nas mesmas 72 horas: Morro da Igreja
  (1.805 m) fica **25 horas** abaixo de 1 km de visibilidade, e Palhoça (4 m)
  fica **3**. O dado separa a serra do litoral sozinho.
- **Sem buraco.** Zero valores nulos em 72 horas × 3 pontos × 5 variáveis.
- **Devolve a altitude de cada ponto**, o que serviu de aferição cruzada com o
  perfil de altimetria: 1.805 m no Morro da Igreja, contra 1.822 m de cota real.
- **Horário local direto.** Com `timezone=America/Sao_Paulo` os carimbos voltam em
  horário de Brasília, sem conversão nossa.

## Alternativas descartadas

| Alternativa | Por que não |
|---|---|
| OpenWeatherMap | Exige chave e cadastro para resolver o que esta resolve sem nenhum dos dois. |
| INMET | Fonte oficial brasileira, mas orientada a estações; a estação mais próxima de um mirante de serra pode estar a dezenas de quilômetros e centenas de metros de altitude de distância — e altitude é justamente o que decide neblina. |
| Só o destino, em vez da rota inteira | A neblina não espera a chegada. O trecho de serra no meio do caminho é onde o problema acontece. |

## Consequências

- **A chamada é sempre do servidor**, como a do traçado. O componente que a faz
  é assíncrono e vive dentro de um `Suspense` com `fallback={null}`: o resto da
  página não espera pela previsão, e ela aparece quando chega.
- **Sem previsão, a página continua inteira.** `null` do cliente significa
  simplesmente que a seção não existe naquela renderização.
- **Cache de 30 minutos** (`next: { revalidate: 1800 }`). Previsão não muda de
  minuto a minuto, e a fonte é gratuita — bater nela a cada visita seria abusar
  de graça alheia.
- **Atribuição visível**, exigida pela licença e justa: o dado é de graça e é de
  alguém.
- **Viagem concluída não mostra previsão.** Seria o clima de outro dia que não o
  vivido.

### Um ponto devolve objeto; vários devolvem array

A armadilha desta fonte. Com uma coordenada, o corpo é um objeto; com duas ou
mais, é um array. Tratar sempre como array daria `undefined` silencioso
justamente na viagem de uma parada só. O cliente normaliza (`Array.isArray(body)
? body : [body]`) e o comentário no código explica por quê.

### Cobertura de nuvem baixa NÃO serve de sinal

Medido: Palhoça aparece com **100% de nuvem baixa e 22 km de visibilidade** na
mesma hora. Nuvem sobre a cabeça não é serra fechada. A variável foi tirada do
pedido, e só a visibilidade decide.

### Os cortes de visibilidade e a janela de rodagem

- **Abaixo de 1 km = fechado.** É a definição meteorológica de nevoeiro, e não um
  número escolhido por conveniência.
- **Abaixo de 5 km = pouca visão.** Ainda se anda, mas não se vê a curva nem o
  mirante — que é metade do motivo de subir.
- **Das 7h às 19h.** Sem essa janela, a serra "fecha" às 3 da manhã em quase todo
  dia de inverno e o aviso vira ruído. Para hoje, a janela começa na hora atual:
  avisar às 15h que fechou às 8h é história, não previsão.
- **O ponto crítico é escolhido por gravidade, depois por quantas horas ela
  dura.** Na primeira medição na tela, sem o critério das horas, Palhoça era
  eleita "o ponto que decide a viagem" por uma neblina de amanhecer que levanta
  às 8h, na frente de uma serra dentro da nuvem por três horas.

## Isto é previsão, e a tela diz isso

O Rastro recusa apresentar dado não verificado como verificado — é a regra que
mandou a subida acumulada para fora do perfil de altimetria e que obriga a
interface a dizer quando a distância é estimada.

Previsão do tempo é, por natureza, incerta. Por isso a palavra **previsão** fica
visível no cabeçalho da seção, sempre, e a fonte é nomeada no rodapé dela. O
bloco fica visualmente separado dos números medidos que estão logo acima.

## Gatilho de revisão

Se um dia a previsão passar a ser pedida em volume — para todos os lugares do
mapa, ou a cada carregamento de lista —, o cache de 30 minutos deixa de bastar e
a política de uso da fonte volta à mesa.
