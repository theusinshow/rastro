# Estratégia de mapa

O mapa é o elemento estrutural da interface do Rastro, não um widget dentro de
uma tela. Este documento registra como ele é construído e por quê.

---

## Por que `maplibre-gl` puro

Não usamos `react-map-gl`. A decisão está registrada no
[ADR 0001](./decisions/0001-stack-e-limite-de-dependencias.md): o wrapper custa
uma dependência e um modelo mental adicional para economizar cerca de 80 linhas
de hook, ao preço de perder controle fino sobre camadas e expressões do
MapLibre — que é exatamente onde este produto gasta seu esforço.

A integração própria vive em três arquivos pequenos:

| Arquivo | Responsabilidade |
| --- | --- |
| `src/lib/map/config.ts` | Chave, enquadramento inicial, zoom inicial |
| `src/lib/map/style.ts` | `buildRastroStyle(key)` — o estilo autoral |
| `src/components/map/map-context.tsx` | Contexto da instância e da câmera |

E a instância vive no layout, não nas páginas — ver
[ADR 0002](./decisions/0002-mapa-persistente-no-layout.md).

---

## Os três princípios do estilo

O estilo é escrito por nós sobre os vector tiles do MapTiler (schema
OpenMapTiles v3). Não é um preset do MapTiler com cores trocadas.

1. **A estrada é o conteúdo.** Num app de moto a malha viária recebe o maior
   contraste do mapa, acima de qualquer outro elemento de base. As rodovias são
   a coisa mais clara na tela depois dos pins.
2. **O fundo cede o palco.** Água quase preta, vegetação apenas insinuada. O que
   precisa ser lido são os pins e as estradas; tudo o mais é contexto.
3. **Relevo importa.** O hillshade a partir do terrain-RGB é o que faz as serras
   catarinenses existirem visualmente em vez de virarem mancha plana. Sem ele,
   a Serra do Rio do Rastro e a Serra do Corvo Branco são apenas linhas tortas.

**Nenhuma cor da base usa o âmbar do produto** (`#f0a32b`). O âmbar é reservado
aos pins e à interface, para que sempre se destaque contra o mapa.

---

## Fontes de dados

```
basemap  vector      https://api.maptiler.com/tiles/v3/tiles.json
terrain  raster-dem  https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json  (tileSize 256)
glyphs               https://api.maptiler.com/fonts/{fontstack}/{range}.pbf
```

Não definimos `maxBounds`: viagens longas podem sair de Santa Catarina.

---

## Camadas, em ordem

A ordem importa: no MapLibre a última camada da lista é a que fica por cima.

| # | Camada | Tipo | Cor | Razão |
| --- | --- | --- | --- | --- |
| 1 | `background` | background | `#0a0c0b` | Mesmo `--color-void` do design system: o mapa e o chrome partem do mesmo preto esverdeado, sem costura visível |
| 2 | `landcover-wood` | fill | `#0e1512` @ 0.75 | Mata apenas insinuada, um passo acima do fundo |
| 3 | `park` | fill | `#0f1714` @ 0.6 | Unidades de conservação um pouco mais claras que a mata comum |
| 4 | `water` | fill | `#060b0e` | Mais escuro que o fundo: o oceano é o vazio, e a costa se lê por contraste negativo |
| 5 | `waterway` | line | `#0d1519` | Rios como fio quase invisível, largura interpolada de z8 a z14 |
| 6 | `hillshade` | hillshade | sombra `#000000`, luz `#3d4d46`, acento `#121a17` | **Acima da base e abaixo das estradas**, para que a sombra dê volume ao terreno sem sujar a malha viária. Exagero em 0.38 — o suficiente para ler a serra, pouco o bastante para não virar textura |
| 7 | `road-minor` | line | `#3f3d38` | Ruas e vias de serviço, só a partir de z10 |
| 8 | `road-tertiary` | line | `#6a655c` | Terciárias e secundárias — as estradas de curva que interessam |
| 9 | `road-primary` | line | `#948b7c` | Primárias e trunk |
| 10 | `road-motorway` | line | `#bcb09a` | O elemento mais claro da base inteira |
| 11 | `boundary-admin` | line | `#2b322f`, tracejado | Divisas até `admin_level` 4, tracejadas para não competirem com estradas |
| 12 | `road-label` | symbol | texto `#9aa5a0` | Nome da via sobre a linha, a partir de z11 |
| 13 | `place-label` | symbol | texto `#c3ccc8` | Cidades, vilas e povoados |

A rampa de cinzas das camadas 7 a 10 (`#3f3d38` → `#6a655c` → `#948b7c` →
`#bcb09a`) é o princípio 1 tornado numérico: quanto mais importante a estrada,
mais clara ela é, e a rodovia é o pico de luminância da base.

---

## Tipografia do mapa

**Os labels do mapa não usam Geist Mono, e não podem usar.**

O MapTiler serve glyphs apenas de famílias que ele hospeda — Noto Sans e
similares. Usar Geist Mono no mapa exigiria gerar e hospedar um conjunto de
`.pbf` próprio, com todos os intervalos Unicode necessários, e servi-lo junto da
aplicação. É um custo de infraestrutura desproporcional ao ganho.

A solução é tratar a família como o que ela é — um portador neutro — e tirar o
caráter cartográfico do **tratamento**:

- `Noto Sans Regular` como família.
- `text-transform: uppercase` nos nomes de lugar.
- `text-letter-spacing` largo: `0.16` em lugares, `0.08` em vias.
- Halo na cor do fundo (`#0a0c0b`), para leitura sobre qualquer relevo.

Caixa alta com tracking largo é a mesma gramática do `.instrument-label` do
design system. O resultado lê como carta náutica, não como Google Maps — e a
diferença de família com o chrome HTML acaba sendo imperceptível.

**Geist Mono segue exclusivo do chrome HTML**: barra de status, valores
numéricos, rótulos de instrumento. Essa separação é deliberada e não deve ser
"corrigida".

---

## Rotação desabilitada

```ts
dragRotate: false,
pitchWithRotate: false,
map.touchZoomRotate.disableRotation()
```

O norte é fixo. Duas razões:

1. **Convenção cartográfica.** Norte para cima é como se lê um mapa de papel, e
   é como o usuário já pensa a geografia de Santa Catarina.
2. **Uso rápido durante uma viagem.** Um mapa girado por acidente — o que
   acontece com facilidade em trackpad e em toque — custa segundos de
   reorientação num momento em que a atenção está em outro lugar. O ganho de
   poder girar não paga esse custo.

Inclinação (`pitch`) fica igualmente fora: o hillshade já resolve o relevo em
duas dimensões, sem o custo de renderizar terreno 3D.

---

## A chave do MapTiler é pública, por definição

`NEXT_PUBLIC_MAPTILER_KEY` é inlinada no bundle do cliente. Isso é esperado, não
um vazamento:

- Chaves de tiles são **inerentemente visíveis pelo cliente**. O navegador
  precisa montar a URL do tile; qualquer proxy apenas move o segredo, sem
  eliminá-lo, e adiciona latência e um ponto de falha.
- A proteção correta é **restrição por domínio no painel do MapTiler**
  (Account → Keys → allowed origins), não obscuridade.

Não tente esconder ou fazer proxy dessa chave. Se ela vazar para um domínio não
autorizado, a restrição de origem é o que a torna inútil.

---

## Estado de ausência de chave

Sem `NEXT_PUBLIC_MAPTILER_KEY`, `<MapCanvas />` renderiza `<MapFallback />` em
vez de tentar subir o MapLibre: um painel com hairline, o nome exato da variável
e onde obter a chave. Nunca um mapa cinza sem explicação — a aplicação sobe
inteira e diz o que falta.

---

## O worker do maplibre-gl

O `maplibre-gl` 6 não embute mais o worker no bundle: ele resolve
`maplibre-gl-worker.mjs` como arquivo irmão a partir de `import.meta.url`. Sob o
Turbopack esse arquivo não existe — o módulo vira um chunk hasheado — e o worker
morre calado. O sintoma é cruel: o mapa aceita eventos, publica câmera e não
desenha nada, porque o erro acontece dentro do worker e não chega ao console da
página.

A solução:

- `scripts/copy-maplibre-worker.mjs` copia `maplibre-gl-worker.mjs` e
  `maplibre-gl-shared.mjs` de `node_modules/maplibre-gl/dist` para
  `public/maplibre/`, com os nomes originais — o worker importa o `shared` por
  caminho relativo.
- O script roda em `postinstall`, `predev` e `prebuild`.
- `public/maplibre/` está no `.gitignore`: são artefatos de build, não código
  nosso, e devem acompanhar a versão instalada do pacote.
- `MapCanvas` aponta o maplibre para lá com
  `setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')`.

Ao atualizar `maplibre-gl`, verifique se o worker ainda precisa disso: se uma
versão futura voltar a embutir o worker, o script e a chamada podem sair.

---

## Camadas de pins

> **Reservado para a Tarefa 9.**
>
> Esta seção descreverá as camadas de pins — fonte GeoJSON dos lugares, cores
> por estado de visita (`--color-visited`, `--color-wanted`, `--color-unvisited`),
> codificação de favorito, comportamento de seleção e interação — e viverá em
> `src/lib/map/layers.ts`, ao lado de `style.ts`.
>
> Regra que já vale: o âmbar do produto é dos pins e da interface. Nenhuma
> camada de base pode disputá-lo.
