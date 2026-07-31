# Handoff: Rastro — direção visual "A régua"

Data: 2026-07-31. Escrito contra o prompt `refazer o design system do Rastro`.

---

## Visão geral

Proposta de direção visual completa para o **Rastro**, o mapa da vida de um
motociclista em Santa Catarina. Cobre paleta (nas duas metades: CSS **e** hex
literal do WebGL), tipografia, elevação, movimento, tratamento de marca e o
tratamento de cada elemento do inventário do §7 do prompt original.

**A tese, em uma frase:** o couro fica, o âmbar fica, o mapa continua sangrando
por baixo de tudo — o que muda é que o produto passa a ter **uma marca gráfica
única para dizer de onde veio cada número**, e essa marca é a faixa central da
estrada, que já era a marca da casa.

---

## Sobre os arquivos deste pacote

Os arquivos aqui são **referências de design feitas em HTML** — protótipos que
mostram a aparência e o comportamento pretendidos. **Não são código de produção
para copiar.** A tarefa é **recriar estes designs no Next.js/React/Tailwind que
o Rastro já usa**, com os padrões e componentes que já existem lá
(`src/components/ui/`, `src/app/globals.css`, `src/lib/map/`).

| Arquivo | O que é |
|---|---|
| `Rastro.dc.html` | Protótipo navegável: 5 telas do produto + folha de sistema. Abre direto no navegador. Botão **Sistema** na barra abre a documentação viva. |
| `rastro-map.js` | Web component do mapa do protótipo. **Usa Leaflet + tiles OSM com filtro CSS só para simular a cartografia.** No produto real isso é MapLibre com o estilo de `map-palette.ts`. Descartar este arquivo na implementação. |
| `Rastro Claro.dc.html` | A mesma coisa na **variante clara** ("a régua, de dia"). Link de ida e volta no rodapé da folha de sistema de cada uma. |
| `rastro-map-claro.js` | Idem, na cartografia de dia. Descartar na implementação. |
| `tokens.css` | Os tokens das **duas** variantes + a barra em relevo, prontos para colar em `src/app/globals.css`. |
| `map-palette.ts` | A outra metade da paleta: hex literais para `src/lib/map/style.ts` e `layers.ts`. |

## Fidelidade

**Alta (hi-fi).** Cores, tipografia, espaçamento, alturas de alvo e curvas de
animação são finais e estão medidos. Recriar com fidelidade de pixel usando as
bibliotecas do repositório. Onde o protótipo divergir deste README, **o README
manda** — o protótipo tem simplificações (o mapa, sobretudo).

---

## 1. O sistema central: a régua

Este é o item que resolve o §8.6 do prompt (medido / estimado / opinião) e é o
que não pode ser perdido na implementação.

**Todo valor numérico do produto se apoia numa régua de 2px de altura, largura
total da coluna, mínimo 48px.** A régua diz de onde o número veio, antes de você
ler a legenda:

| Origem | Régua | Valor | Tipo |
|---|---|---|---|
| **Medido** | sólida, `--color-accent` | `1822` | mono, `--color-ink` |
| **Estimado** | tracejada `5px on / 5px off`, `--color-ink-faint` | `~ 172` (prefixo `~` obrigatório) | mono, `--color-ink` |
| **Desconhecido** | pontilhada `2px on / 4px off`, `rgba(237,230,219,.22)` | `—` (travessão, nunca um palpite) | mono, `--color-ink-faint` |
| **Opinião** | **nenhuma** | texto | **sans**, filete de 2px à esquerda, `--color-ink-muted` |

Quatro origens, quatro formas, nenhuma palavra necessária. Classes prontas em
`tokens.css`: `.instrument-rule--measured / --estimated / --unknown` e
`.type-note`.

**Por que a estrada e não um ícone:** a faixa central tracejada já é a marca, já
é o traçado da viagem no mapa e já significa asfalto interrompido. Interrompido
é exatamente o que um número estimado é. E sobrevive à luva e ao sol porque é
geometria de 2×48px, não um glifo de 12px.

**Regra de mono vs sans, que é a segunda metade do mesmo sistema:** tudo que é
medição está em mono; tudo que é humano está em sans. `RatingPicker` continua em
mono (`4 / 5`) porque é uma escala, mas **nunca** ganha régua, porque é opinião.

### Componente `Stat` — a forma canônica

```
[rótulo]   .instrument-label            12px mono, caixa alta, tracking .16em, ink-faint
[valor]    .instrument-value            20px mono, tabular-nums, ink
[régua]    .instrument-rule--<origem>   2px
[nota]     12px mono, tracking .1em, caixa alta, ink-faint   ex.: "metros", "linha reta"
gap: 7px entre os quatro
```

---

## 2. Design tokens

Ver `tokens.css` — está comentado e é a fonte da verdade. Resumo:

**Superfícies (couro, matiz 30°, saturação baixa de propósito):**
`--color-void #0e0d0c` · `--color-base #191817` · `--color-raised #221f1d` ·
`--color-overlay #2c2926`

**Traços:** `--color-line rgba(237,230,219,.10)` ·
`--color-line-strong rgba(237,230,219,.20)`. Hairline de 1px faz a separação
estrutural no lugar de sombra.

**Tinta (razão medida sobre `--color-base`):**
`--color-ink #ede6db` 14.31 · `--color-ink-muted #bcb2a4` 8.48 ·
`--color-ink-faint #9b9082` 5.66

**Acento:** `--color-accent #e5a338` 8.13 · `--color-accent-strong #cf8a1c` 6.17 ·
`--color-accent-dim #6d4d13` 2.30 (preenchimento, **nunca texto**) ·
`--color-on-accent #16110b` 8.60 sobre o acento

**Estado do dado:** visited `#93a86e` 6.81 · wanted `#e5a338` 8.13 ·
unvisited `#9b9082` 5.66
**Estado de operação:** ok `#93a86e` · warn `#e5a338` · alert `#d97456` 5.56
Coincidem em valor hoje e podem divergir amanhã. **Não unificar.**

> Pior caso do sistema é sobre `--color-overlay` (hover): nenhum par cai abaixo
> de 4.5. ink 11.67 · muted 6.92 · faint 4.62 · accent 6.63 · visited 5.55 ·
> alert 4.53. Todo par novo entra com a razão medida.

**O que mudou em relação à paleta atual:** a superfície esquentou um grau
(`#181716` → `#191817`, `#11100f` → `#0e0d0c` para o void afundar mais que o
fundo do mapa), a tinta clareou um passo (`#eae3d8` → `#ede6db`,
`#93887a` → `#9b9082`, que dá margem de AA sobre `overlay`), o âmbar subiu em
direção ao farol (`#e0a02e` → `#e5a338`), o alerta ficou mais terracota
(`#d4694a` → `#d97456`). A família é a mesma.

**Tipografia:** Archivo (eixo de largura variável) + JetBrains Mono. **A escala
não muda** — 12/1, 15/1.5, 17/1.55, 20/1.4, 24/1.2, 32/1. Continua não existindo
`--text-base`: escrever essa classe é erro silencioso.

**Classes de caráter:** as cinco existentes ficam sem alteração
(`.instrument-label`, `.instrument-value`, `.type-display`, `.type-title`,
`.type-wordmark`). Entram duas: `.instrument-rule` e `.type-note`.

**Espaçamento e raio:** inalterados. 8 / 12 / 20 / 32; raios 8 / 14 / 20 / 28 /
36 / 999.

**Elevação — agora DUAS camadas:**
- `--shadow-float` `0 18px 40px -24px rgb(0 0 0 / .9)` — separa cromo do mapa.
  Papel inalterado.
- `--shadow-lift` = float **+** `0 8px 22px -14px rgb(0 0 0 / .85)` — nunca
  aparece sozinha. **Justificativa:** agora há painel sobre painel (o do lugar
  abre por cima do FilterRail; o card do balanço do ano sobe sobre a timeline).
  Com uma camada só os dois viram uma massa chapada e o usuário perde qual deles
  tem o teclado. **Quem tem a camada 2 tem o foco.**

---

## 3. Telas

### 3.1 Cromo comum a todas

**TopBar — cápsula flutuante em relevo.** Altura 60px, `radius-full`,
destacada do topo em 14px, `backdrop-filter: blur(18px) saturate(1.2)`. O
relevo é feito com quatro camadas e **nenhum gradiente**: filete interno claro
em cima (a luz), sombra interna curta embaixo (a espessura), uma aresta sólida
de 3px (o corpo) e as duas sombras de projeção do sistema. Apertar qualquer
tecla da barra tira a aresta — `translateY(2px)`, 90ms, `out-quart` — e ela
afunda de verdade. Camada de movimento: **zerado**.

**Uma cor por destino.** Explorar âmbar `#e5a338` · Descobrir terracota
`#d9834a` · Viagens oliva `#93a86e` · Memórias azul de carta náutica
`#8fa9c2`. Matizes vizinhos, mesma leveza, todos dentro da família — nenhum
azul de SaaS. O **preenchimento é o mesmo nas duas variantes**: o destino tem a
mesma cor de dia e de noite, e isso é o que faz a cor virar identificador e não
enfeite. O rótulo sobre o preenchimento é a tinta escura (`--color-on-accent`),
com razão 8.60 / 6.52 / 7.21 / 7.70. O que muda entre as variantes é só a tinta
do glifo quando o destino **não** está ativo, que precisa de razão sobre a
superfície: na clara os quatro escurecem (`#8a5a0c`, `#9c4a1f`, `#4f6b2c`,
`#3f5a75`).

Destino inativo continua sendo uma tecla: fundo `--color-raised`, filete,
realce interno de 1px, rótulo em `--color-ink-muted` — **o rótulo nunca é
colorido**, só o glifo. Ativo: preenchido na sua cor, peso 700, aresta de 2px e
um brilho curto da própria cor (`0 12px 22px -14px`).

Painéis descem para `top: 86px` por causa da barra mais alta.

**Estrutura da barra** — pílula flutuante, `top/left/right: 12px`, altura 56px, `radius-lg`,
`background rgba(25,24,23,.93)`, `backdrop-filter: blur(16px) saturate(1.1)`,
borda `--color-line`, `--shadow-float`. Conteúdo, da esquerda: lockup da marca
(SVG 26px + wordmark 17px) · divisor vertical 1×26px · 4 destinos (glifo 20px +
rótulo 15px, altura 40px, `radius-full`; ativo = fundo `--color-overlay`, texto
`--color-accent`) · espaçador · **Novo lugar** (sólido âmbar, 40px, radius-full,
peso 700) · **Sistema** (mono 12px, borda de filete) · **Sair** (ghost, muted).

**StatusBar** — pílula 36px no canto inferior esquerdo, `bottom/left: 12px`.
Células de 28px separadas por filete vertical de 1px, tudo mono 12px, caixa
alta, tracking .14em, tabular-nums: coordenada do centro (4 casas) · `Z 8` ·
`14 / 14 LUGARES` · `ORIGEM: FLORIANÓPOLIS`. A primeira célula em
`--color-ink-muted`, as demais em `--color-ink-faint`.

**OverlayPanel** — `top: 80px; bottom: 60px`, `radius-lg`, mesma superfície e
blur da barra. Esquerda 380px (`--panel-base`, conteúdo da tela), direita 420px
(`--panel-wide`, o objeto selecionado, com `--shadow-lift`). Entrada:
`opacity 0→1` + `translateX(∓12px)`, 220ms `out-quint`. Saída segurada (o
`useExitTransition` que já existe).

**nav-icons** — 4 glifos de traço 1.75, pontas e junções arredondadas, sem
preenchimento, `viewBox 0 0 24 24`, `stroke: currentColor`:
- Explorar: pin — `M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z`
- Descobrir: bússola — círculo r=9 + `M15.6 8.4 13.4 13.4 8.4 15.6 10.6 10.6z`
- Viagens: a curva da marca — `M5 20c4.4 0 4.4-7 8-7s3.5-3 3.5-3` + seta `M16.5 6.6 19.4 10 16.4 13.2`
- Memórias: linhas de timeline — `M4 6.5h10M4 12h16M4 17.5h7` + tick `M18.5 5.4v2.6`

### 3.2 Explorar

Painel esquerdo de 380px. Cabeçalho: `.instrument-label` "EXPLORAR" + contagem
viva `14 DE 14` à direita (mono, `data-motion="signal"`).

**PlaceSearch** — campo de 48px, `--color-raised`, lupa de 17px em
`--color-ink-faint` a 14px da esquerda, texto 17px, foco troca a borda para
`--color-accent`.

**FilterRail** — segmento único de dois botões dentro de uma pílula
`--color-raised` de 4px de padding: **Lista** e **Filtros**. Resolve o
1017px-numa-coluna-de-861px trocando de modo em vez de empilhar tudo. No modo
Filtros, rodapé fixo (fora da rolagem) com a ação primária mostrando a contagem
viva — `Ver 14 lugares` — e **Limpar** em outline.

Grupos de filtro, `space-section` (32px) entre eles: **Situação** (3 chips com
marca de estado colorida), **Etiqueta** (8 chips), **Distância da origem** (4
chips).

**Chip** — altura mínima 44px, padding 0 16px, `radius-full`, gap 9px, texto
15px. Inativo: `--color-raised` + borda `--color-line` + texto muted. Ativo:
`rgba(229,163,56,.14)` + borda `rgba(229,163,56,.55)` + texto ink. A marca de
estado é um ponto de 9px: preenchido quando ativo, só contorno de 1.5px quando
não.

**PlaceList** — linhas de 64px mínimos, `radius-md`, gap 14px: ponto de estado
(11px, preenchido; não-visitado é oco com miolo `--color-base`) · nome 17px +
município·etiquetas 15px muted · à direita a distância `~ 172 km` em mono com
**régua tracejada de 38px**. Selecionada: fundo `--color-overlay`.

**Estado vazio** — aparece após 120ms. Frase seca + saída de um clique com a
contagem no próprio rótulo: `Limpar busca — 14 lugares`, outline âmbar de 44px.

**PlacePanel** (direita, 420px, `--shadow-lift`):
- Cabeçalho com filete embaixo: `.instrument-label` na cor do estado
  ("VISITADO" em `--color-visited`) · nome em `.type-title` 24px ·
  município·etiquetas 15px · `CloseButton` 44×44 circular de filete.
- Três `Stat` em grade: Distância `~ 172` (estimado, "linha reta") · Tempo
  `~ 2h52` (estimado, "a 60 km/h") · Altitude `1420` (**medido**, "metros").
- `PlaceStateControls` — três chips: Visitado, Quero ir, Favorito.
- `PlaceSurface` — bloco `--color-raised` com **régua pontilhada de 44px** à
  esquerda e a frase: *"Não sabemos o piso do acesso. Ninguém anotou ainda."*
  Nunca "asfalto" por omissão.
- `PlaceVisits` — cards `--color-raised`: data em mono muted + nota em mono
  âmbar (`5 / 5`), e a review como `.type-note` (sans, filete à esquerda).
- `PlacePhotos` — grade de 3 quadrados, `radius-sm`, listrado a 135° em
  `rgba(237,230,219,.05)` enquanto não há foto, com rótulo mono do que vai ali.
- Rodapé fixo: **Somar à viagem** (sólido, 48px) + **Editar** (outline).

### 3.3 Descobrir

**DiscoveryLauncher** — pílula âmbar de 64px centrada, `bottom: 72px`, texto
`PARA ONDE VAMOS?` em `wdth 115`, peso 700, 20px, caixa alta, tracking .04em.
Sombra dupla. O glifo é uma bússola que **vira o vetor da rota** quando a
resposta chega (morph de `d`, 320ms out-quint).

**DiscoveryForm** — Tempo disponível em grade 2×2 de chips · Raio a partir da
origem em `range` (altura 44px, `accent-color: var(--color-accent)`) com o valor
vivo em mono âmbar no cabeçalho da seção · Categorias em chips.

**DiscoveryResults** — cards `--color-raised` com stagger de 35ms (trava em 8).
Nome + situação em mono na cor do estado; duas leituras (`~ 2h40`, `~ 160 km`),
ambas com **régua tracejada**. A frase "linha reta" fica no fim da lista, não em
tooltip.

### 3.4 Viagens

**TripList** — agora são **cards** (ver §5, contraria o §3 do prompt).
`--color-raised`, `radius-md`, filete. Ativo: `--color-overlay`, borda
`rgba(229,163,56,.35)`, `--shadow-lift`, e uma **barra âmbar de 3px na borda
esquerda** (`radius 3px 0 0 3px`). Conteúdo: nome 17px + data em mono 12px; três
leituras de 20px mono (`412`, `6h20`, `5`) — as duas primeiras com régua sólida
(medidas), a de paradas com régua neutra `rgba(237,230,219,.12)` porque é
contagem, não medição.
Rodapé: **Montar nova viagem**, 56px, borda tracejada de 1px.

**TripProposalForm** (456 linhas hoje) — dividir em quatro `Section`: proposta,
paradas, medição, salvar.

**TripItineraryView** (painel direito):
- Cabeçalho com `.instrument-label` âmbar "ROTEIRO MEDIDO".
- Três `Stat` **com régua sólida**: `412` km de estrada · `6h20` sem paradas ·
  `1822` metros.
- `InlineMessage` de alerta: fundo `rgba(217,116,86,.10)`, borda
  `rgba(217,116,86,.35)`, glifo de 20px em `--color-alert`, texto 17px em ink.
- `ElevationProfile` — SVG `viewBox 0 0 360 120`: área a
  `rgba(229,163,56,.16)`, traço `--color-accent` 2px com junções arredondadas,
  hairlines de 1px em `--color-line-strong` no ponto mais alto e no mais baixo.
  Abaixo, três leituras com régua sólida. **Subida acumulada continua fora** — o
  dado não a sustenta.
- `RouteWeatherPanel` — chips de dia (56px, rótulo mono + temperatura mono) ·
  frase do ponto crítico em 17px ink · **régua tracejada de largura total**
  separando (é previsão) · uma linha por parada, com o risco em
  `--color-alert`.
- Paradas — trilho vertical: ponto de 10px (cheio nas pontas, oco no meio, borda
  âmbar de 2px) ligado por uma linha **tracejada vertical âmbar** de 2px. Nome
  17px + meta em mono 15px.
- Rodapé: **Marcar como feita** + **Editar**.

### 3.5 Memórias

**MemoryTimeline** — cabeçalho de mês **sticky** com fade de 30px por baixo
(`linear-gradient(--color-base 70%, transparent)`): rótulo mono ink + filete que
ocupa a folga + contagem mono faint. Entradas em card `--color-raised` com
stagger de 35ms: miniatura de 64px (`radius-sm`, listrada quando é foto;
`rgba(229,163,56,.10)` com borda âmbar quando é viagem, que não tem foto) ·
tipo em mono na cor do vocabulário (Visita = visited, Viagem = accent, Foto =
muted) · título 17px · sub 15px.
Grupo **"Sem data conhecida"** recebe o mesmo tratamento. Não inventa data.

**YearInReview** — card de `radius-lg` com `--shadow-lift`. Título em
`.type-title` 24px. Quatro leituras em grade 2×2, cada uma com régua sólida que
**entra com `scaleX` de 320ms** a partir da esquerda. Rodapé: *"Só o que
aconteceu. Nada que ficou em zero aparece aqui."* — nada de "VIAGENS 0".

### 3.6 Perfil / onboarding

**OriginSetup** — campo de 48px; sugestões em lista de 52px por linha dentro de
um bloco `--color-raised` com filete entre itens; **Escolher no mapa** como
botão de 48px que, ativo, fica com o tratamento de chip ligado.
**PointPicker** — alvo âmbar de 72px fixo no centro da tela (círculo r=15 + quatro
hastes + ponto central), `drop-shadow` para sobreviver a qualquer cartografia; o
mapa se move sob ele. Barra de confirmação flutuante acima da statusbar:
frase 17px + **Fixar aqui** em pílula âmbar de 44px.

**Autonomia** — dois campos mono (Tanque, Consumo) + um bloco derivado:
`~ 336 km` com **régua tracejada** e a ressalva *"Conta de tanque cheio em
estrada plana. Na serra, menos."*

---

## 4. Movimento

Um ritmo só. Sem bounce, sem elastic. Saída sempre ~70% da entrada.
Deslocamento de 12px (pequeno de propósito: um slide de fora da tela leria como
gaveta e puxaria o olho para longe do mapa).

| Peça | Duração | Curva | `prefers-reduced-motion` |
|---|---|---|---|
| press (`scale .98`) | 90ms | out-quart | zerado |
| hover e cor | 140ms | out-quart | zerado (a cor final fica) |
| entrada de painel + 12px | 220ms | out-quint | zerado — o painel só aparece |
| primeira pintura do mapa | 320ms | out-quart | zerado |
| régua entrando (`scaleX`) | 320ms | out-quint | zerado |
| desenho do glifo ativo (`stroke-dashoffset`) | 420ms | out-quint | zerado |
| bússola → rota no CTA | 320ms | out-quint | zerado — troca seca de forma |
| traço da marca, uma vez por sessão | 520ms | out-quint | zerado |
| stagger (trava em 8, total ≤ 280ms) | 35ms | — | zerado |
| **realce de valor que mudou** | 400ms | out-quart | **PRESERVADO** — carrega informação |
| **crossfade dos pins** | 220ms | out-quart | **PRESERVADO** — é a evidência do recorte |
| câmera do mapa | ~1100ms | do MapLibre | **DELEGADO** — nunca passar `essential: true` |

Implementação: marcar o que é decorativo com `data-motion="decor"` e o que é
sinal com `data-motion="signal"`; o bloco de media query em `tokens.css` faz o
resto. **Nada de `* { animation-duration: 0.01ms !important }`** — mataria a
câmera do mapa (que aqui é navegação) e o crossfade dos pins.

**Morfismo de ícone é sempre informação, nunca enfeite.** Os dois casos: o glifo
do destino ativo redesenha o próprio traço ao assumir (`stroke-dasharray: 96` +
`dashoffset` animado); a bússola do CTA vira o vetor da rota quando a resposta
chega. Ambos na camada zerada — sob movimento reduzido a forma final aparece de
uma vez, e ela sozinha já diz o estado.

---

## 5. Onde isto contraria o §3 do prompt

Uma frase por item, como pedido. O ADR que substitui o anterior é escrito por
quem implementa.

1. **Card com conteúdo primário:** Viagens e Memórias passam a ser cards; o mapa
   continua sem caixa.
2. **Segunda camada de elevação:** `--shadow-lift` existe para painel sobre
   painel e para o card do balanço do ano.
3. **Ícone fora da navegação:** só onde há rótulo colado ou onde o glifo é o
   próprio estado (bússola do CTA, alvo do PointPicker).
4. **Glassmorphism:** o cromo tem blur sempre, não só sobre o mapa, para ser a
   mesma superfície em todas as telas.
5. **Gradiente:** um só, e não é decoração — o fade de 30px sob o cabeçalho
   sticky de Memórias.

Os dois pontos do §1 continuam de pé sem exceção: nada abaixo de 17px de corpo,
12px de rótulo e 44px de alvo; e toda leitura numérica declara sua origem pela
régua, sem legenda.

---

## 6. 390px

Nada encolhe. O corpo continua em 17, o rótulo em 12, o alvo em 44. Muda a
arrumação:

- **Entre 768px e 1120px** (laptop comum) a barra não cabe com tudo aberto — a
  soma medida com todos os elementos é 1057px. O que cede, nessa faixa: o
  wordmark sai (a marca fica), o rótulo de "Novo lugar" sai (vira só o `+`,
  44px) e o gap cai de 20 para 14. **Nenhum rótulo de destino cai** — os quatro
  glifos continuam com a palavra ao lado, que é o §3 do prompt. Abaixo de 900px
  o atalho "Sistema" (que só existe no protótipo) some também.
- **TopBar em duas linhas**, altura total 104px: linha 1 = marca + wordmark +
  "Novo lugar" reduzido a um `+` de 44×36 + "Sair"; linha 2 = os destinos. Não
  rolar na horizontal — cortava "Descobrir" no meio da palavra.
- **Painel vira folha inferior** de `45vh` (`--sheet-height`), `radius-xl` só em
  cima, pegador de 44×4px centrado, sombra invertida
  (`0 -18px 40px -24px`).
- **A folha do lugar sobe mais** (topo a 180px) e ganha `--shadow-lift`.
- **O rodapé de ação da folha é fixo, fora da rolagem.** De luva, o polegar não
  caça botão.
- StatusBar some abaixo de 768px; a contagem migra para o cabeçalho da folha.

As três telas anotadas estão na seção 07 da folha de sistema do protótipo.

---

## 7. Estado (protótipo)

`screen` (explorar | descobrir | viagens | memorias | perfil | sistema) ·
`selected` (id do lugar) · `trip` (id) · `rail` (lista | filtros) · `query` ·
`filters {visited, wanted, unvisited, tag}` · `radius` · `timeSlot` · `cats` ·
`weatherDay` · `origin` · `picking` · `cam {lat, lng, zoom}`.

Regras: escolher um lugar fecha o itinerário e vice-versa (um painel direito por
vez); trocar de destino limpa a seleção; a câmera enquadra o alvo com
`padding: [90, 440]` para o painel direito não cobrir o pin.

---

## 8. Fontes e assets

- **Archivo** (eixo `wdth` variável, 62–125) e **JetBrains Mono** — Google
  Fonts, já em uso no produto.
- Nenhuma imagem. Fotos são placeholders listrados com rótulo mono do que vai
  ali; o dono fornece as reais.
- Todos os glifos são SVG inline de traço 1.75, sem preenchimento; os `d` estão
  no §3.1 e no protótipo.
- A geometria da marca está duplicada em `src/components/ui/Logo.tsx` e
  `src/app/icon.svg` — **mexer nos dois**. Compensação óptica de traço por
  tamanho mantida: 4.0 / 4.3 / 4.6 / 5.2 conforme a marca encolhe; a faixa
  central some abaixo de 32px.

---

## 9. Como verificar

Do §9 do prompt: não se declara pronto o que não foi visto. Ao implementar, medir
no navegador headless autenticado, e conferir especificamente:

1. Nenhuma coluna de filtros somando mais que a altura disponível.
2. Nome de lugar longo (**"Serra do Rio do Rastro"**, **"Rota das Cachoeiras"**)
   ao lado do rótulo de neblina, sem corte.
3. Nenhum contador em zero exibido no balanço do ano.
4. Todo `Stat` renderizado com régua — um `Stat` sem régua é bug, não é estilo.
5. Todo controle com alvo ≥ 44px e anel de foco âmbar visível.
