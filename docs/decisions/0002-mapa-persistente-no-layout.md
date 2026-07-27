# 0002 — Mapa persistente no layout

## Contexto

O Rastro tem quatro áreas — Explorar, Descobrir, Viagens e Memórias — e todas
compartilham o mesmo mapa. O mapa não é um widget de uma das telas: é a
estrutura da interface, e as telas são camadas de leitura sobre ele.

Montar o mapa dentro de cada página faria o MapLibre ser destruído e recriado a
cada navegação. As consequências são concretas e todas ruins:

- Recarga de tiles vetoriais e do terreno a cada troca de rota, gastando quota
  do MapTiler e banda em conexões ruins de estrada.
- Perda da posição e do zoom: quem estava olhando a Serra do Rio do Rastro
  voltaria para o enquadramento inicial ao consultar uma viagem.
- Um piscar de tela — o mapa preto por alguns quadros até o primeiro render —
  a cada clique de navegação.
- Recriação do contexto WebGL, que é a parte mais cara da inicialização.

## Decisão

`<MapCanvas />` vive em `src/app/(app)/layout.tsx`, dentro de um `<MapProvider>`
que envolve as três faixas da interface. As páginas renderizam **apenas
overlays** sobre ele, num contêiner irmão com `pointer-events-none` — cada
painel reativa `pointer-events` por conta própria.

```
<MapProvider>
  <TopBar />
  <div className="relative flex-1">
    <MapCanvas />                              ← instância única, nunca desmonta
    <div className="pointer-events-none ...">  ← {children}: overlays das rotas
  </div>
  <StatusBar />
</MapProvider>
```

O acesso à instância acontece por contexto:

- `useMapInstance(): MapLibreMap | null` — a instância, registrada apenas no
  evento `load`. Antes disso o estilo ainda não tem camadas, e quem registra
  fontes ou camadas precisa de um mapa pronto.
- `useMapView(): MapView | null` — centro e zoom atuais, publicados a cada
  evento `move`. É o que alimenta a barra de status.

## Consequências

**A favor:**

- A instância sobrevive à navegação: posição, zoom e estado de câmera são
  contínuos entre as quatro áreas. Verificado navegando de `/` para `/viagens`
  e de volta com a câmera fora do enquadramento inicial — as coordenadas e o
  zoom na barra de status permanecem idênticos.
- Nenhum recarregamento de tiles ao trocar de rota.

**Contra, e aceito:**

- O acesso ao mapa passa por contexto em vez de props. Isso é acoplamento
  implícito: um componente que chama `useMapInstance()` não declara essa
  dependência na sua assinatura.
- Páginas que registram camadas precisam tratar o caso de o mapa ainda ser
  `null` durante o carregamento — o `load` pode acontecer depois da primeira
  renderização da página.
- O provider re-renderiza a cada evento `move` do mapa, porque `view` é estado
  de React. Os consumidores atuais são baratos (a barra de status renderiza
  três `span`s); se isso deixar de ser verdade, a saída é separar o contexto de
  câmera do contexto de instância, não abandonar a decisão.

## Alternativa recusada

**Manter o mapa em cada página e sincronizar a câmera via URL** (`?lat=&lng=&z=`),
restaurando o enquadramento ao montar. Reduz o acoplamento por contexto e daria
URLs compartilháveis de graça. Recusada porque não resolve o problema real: o
custo de recriação do contexto WebGL, a recarga de tiles e o piscar continuam a
cada navegação — a câmera seria restaurada, mas depois do flash. Estado
compartilhável por URL continua desejável para filtros e seleção (ver ADR 0006)
e pode ser adicionado por cima desta decisão, sem conflito.
