# Design system — Rastro

Este documento descreve a linguagem visual do Rastro: os tokens CSS, as regras
não negociáveis de forma e os primitivos de interface (`Button`, `Chip`,
`Toggle`, `Stat`). Toda a interface do produto — inclusive o mapa que a
sustenta — é construída sobre esta base.

O Rastro não pode parecer template SaaS genérico nem "AI slop". Separação vem
de hairlines, não de sombra. Cor vem de instrumento, não de gradiente. Números
vêm de mono, sempre.

---

## Tokens

Definidos em `@theme` dentro de `src/app/globals.css` (Tailwind CSS v4 é
CSS-first — não há `tailwind.config.js`). Cada token de cor gera
automaticamente as utilities `bg-*`, `text-*` e `border-*`; `--radius-xs` gera
`rounded-xs`.

### Superfícies

| Token | Valor | Uso |
|---|---|---|
| `--color-void` | `#0a0c0b` | Fundo de página. Carvão levemente frio, nunca preto puro — preto absoluto achata o mapa e mata a profundidade. |
| `--color-base` | `#101413` | Fundo de painéis e barras estruturais sobre o void. |
| `--color-raised` | `#171c1a` | Elementos elevados um nível acima do base (ex.: cabeçalho de painel). |
| `--color-overlay` | `#1e2422` | Hover/estado ativo de superfícies interativas neutras. |

### Traços

| Token | Valor | Uso |
|---|---|---|
| `--color-line` | `rgba(255,255,255,0.07)` | Hairline padrão — separação estrutural entre regiões, no lugar de sombra. |
| `--color-line-strong` | `rgba(255,255,255,0.14)` | Hairline de maior contraste — bordas de controles interativos (`Button` outline). |

### Texto

| Token | Valor | Uso |
|---|---|---|
| `--color-ink` | `#e8edea` | Texto primário. |
| `--color-ink-muted` | `#9aa5a0` | Texto secundário (rótulos de `Toggle`, hover de `Chip`). |
| `--color-ink-faint` | `#7b8884` | Texto terciário (`.instrument-label`, `Chip` inativo, statusbar). **5.04:1 sobre `base` e 4.68:1 sobre `raised`** — passa AA. O tom anterior, `#5e6b66`, media 3.33:1 e era usado a 10px em texto que carrega informação. A leitura de instrumento vem do mono, do tracking e da caixa alta, não de o texto estar apagado. |

### Acento

| Token | Valor | Uso |
|---|---|---|
| `--color-accent` | `#f0a32b` | Âmbar de instrumento — painel de moto, farol, GPS outdoor. Deliberadamente o oposto do azul de SaaS. Botão `solid`, anel de foco, estado ativo de `Chip`/`Toggle`. |
| `--color-accent-dim` | `#8a5f1a` | Variante escura do acento — seleção de texto (`::selection`). |

### Estados de visita

| Token | Valor | Uso |
|---|---|---|
| `--color-visited` | `#3fbf8f` | Lugar já visitado. |
| `--color-wanted` | `#f0a32b` | Lugar que se quer conhecer (mesmo tom do acento — reforça a intenção). |
| `--color-unvisited` | `#7d8a85` | Lugar neutro, sem relação de visita registrada. |

### Raio

| Token | Valor | Uso |
|---|---|---|
| `--radius-xs` | `2px` | **Teto de arredondamento do produto inteiro.** Nenhum elemento usa raio maior que este. Nada aqui é arredondado por decoração. |

### Movimento

Num bloco `@theme static` separado, em `src/app/globals.css`. `static` porque o
Tailwind remove do CSS entregue todo token de `@theme` que nenhuma regra
referencia, e uma escala precisa existir inteira mesmo quando só um degrau dela
está em uso.

| Token | Valor | Uso |
|---|---|---|
| `--dur-instant` | `90ms` | Press. Abaixo do limiar de percepção de 80–100ms. |
| `--dur-fast` | `140ms` | Hover, cor. |
| `--dur-base` | `220ms` | Entrada de painel, revelação de lista. |
| `--dur-slow` | `320ms` | Primeira pintura do mapa. |
| `--dur-signal` | `400ms` | Realce de valor que mudou. **Sobrevive a movimento reduzido.** |
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | Curva padrão. Também usada pela câmera do MapLibre, em JavaScript. |
| `--ease-out-quint` | `cubic-bezier(0.22, 1, 0.36, 1)` | Entrada de painel e de lista. |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Saída. |
| `--default-transition-duration` | `140ms` | Default das utilitárias `transition-*` do Tailwind, que sem isto usariam 150ms com a curva `ease`. |
| `--default-transition-timing-function` | `--ease-out-quart` | Idem. |

Regras do sistema:

- **Sem bounce, sem elastic.** Nenhuma curva ultrapassa o valor final.
- **Saída sempre ~70% da entrada** — `calc(var(--dur-base) * 0.7)`.
- **Movimento que não ajuda a compreender é decoração e não entra.** Cada
  animação do produto responde à pergunta "o que o usuário deixa de entender sem
  ela?".

Dois valores de movimento **não** são tokens CSS, porque quem os consome não lê
CSS:

- **Câmera do mapa** (`src/lib/map/camera.ts`): 600ms para reposicionar, 900ms
  para aproximar, 700ms para enquadrar um conjunto. Escala própria e maior — ali
  o movimento é navegação sobre uma superfície contínua, e o olho precisa
  acompanhar o trajeto para não perder a referência de onde estava.
- **Pintura dos pins** (`src/lib/map/paint.ts`): 220ms para o crossfade de
  recorte, 240ms para o anel de seleção, 140ms para o realce de hover. O
  MapLibre desenha em WebGL e não enxerga variáveis CSS.

#### Classes de movimento

Em `@layer components` de `globals.css`, porque nenhuma tem equivalente em
utilitária:

| Classe | O que faz |
|---|---|
| `.overlay-panel` | Geometria do painel e entrada/saída. Entrada por `@starting-style`; saída por `[data-exiting='true']`, mantida montada por `useExitTransition`. |
| `.stagger-item` | Revelação escalonada, `--stagger-index` por item, travada em 8 itens (nunca passa de 280ms no total). |
| `.press` | `scale(0.98)` em `:active`. Declara a própria transição porque `scale` precisa estar entre as propriedades animadas. |
| `.value-changed` | Realce âmbar de 400ms em valor que mudou. Retriggado por `key={valor}`. |
| `.map-surface` | Fade de primeira pintura, disparado pelo `data-loaded` do evento `load`. |
| `.empty-state` | Fade com 120ms de atraso, para que uma consulta rápida com resultado nunca pisque a mensagem de vazio antes. |

#### Política de `prefers-reduced-motion`

**Não usamos o `* { animation-duration: 0.01ms !important }` de manual.** Ele
mataria também a câmera do mapa, que aqui é navegação e não enfeite, e o
crossfade dos pins, que é a única evidência de que o recorte mudou. Remover os
dois torna o produto mais difícil de usar, não mais seguro.

Três camadas:

1. **Removido.** Deslocamento e fade de painel, escalonamento da lista, press,
   fade de primeira pintura do mapa. O bloco
   `@media (prefers-reduced-motion: reduce)` zera `--dur-instant`, `--dur-fast`,
   `--dur-base`, `--dur-slow`, `--default-transition-duration`, `--motion-shift`,
   `--stagger-step`, `--empty-delay` e devolve `--motion-press` a `1`. Tudo vira
   mudança instantânea de estado. Os dois atrasos entram na lista pelo mesmo
   motivo que as durações: atraso que sobrevive à duração zerada deixa o
   elemento em branco antes de aparecer.
2. **Preservado.** O realce da contagem (`--dur-signal`, só `background-color`) e
   o crossfade de opacidade dos pins. Carregam informação, e opacidade sem
   deslocamento é segura para gatilho vestibular.
3. **Substituído, não removido.** `easeTo` / `flyTo` / `fitBounds` continuam
   acontecendo, com `duration: 0` — corte seco em vez de viagem. Quem faz isso é
   o próprio MapLibre, que honra a preferência sozinho **desde que não se passe
   `essential: true`**. Nenhuma chamada de câmera do Rastro passa.

Para decisões que acontecem em JavaScript existe
`useReducedMotion()` (`src/lib/motion/use-reduced-motion.ts`), doze linhas sobre
`useSyncExternalStore` e `matchMedia`.

---

## Regras de forma não negociáveis

- **Raio máximo `2px`.** Se um componente "parece que precisa" de mais raio
  para ficar bonito, o problema é outro (espaçamento, contraste), não o raio.
- **Hairline no lugar de sombra.** Nenhuma sombra difusa separa regiões da
  interface. Separação é sempre uma borda de 1px em `--color-line` ou
  `--color-line-strong`.
- **Todo dado numérico usa `.instrument-value`.** Distância, coordenada,
  duração, zoom — qualquer número que representa uma medição usa a classe
  `.instrument-value`, que aplica `font-family: var(--font-mono)` e
  `font-variant-numeric: tabular-nums`. Texto comum (nomes, descrições) nunca
  usa esta classe.
- **Ícone só quando substitui texto**, nunca como decoração ao lado de um
  rótulo que já diz a mesma coisa.
- **Nenhum card contendo conteúdo primário.** O mapa é estrutura, não um
  widget dentro de uma caixa.

---

## Tipografia

Duas famílias, carregadas via `next/font/google` em `src/app/layout.tsx` —
zero dependência nova, auto-hospedadas pelo Next (sem requisição a domínio
externo em runtime):

- **Geist Sans** (`--font-sans`) — texto de interface.
- **Geist Mono** (`--font-mono`) — todo dado numérico e todo rótulo de
  instrumento (`.instrument-label`, `.instrument-value`).

### Classes utilitárias de instrumento

Definidas em `@layer components` de `src/app/globals.css`:

```css
.instrument-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--color-ink-faint);
}

.instrument-value {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
}
```

`.instrument-label` carrega boa parte do caráter técnico do produto: caixa
alta, tracking largo, mono, discreto.

### Nota importante: os labels do mapa NÃO usam Geist Mono

O MapTiler serve glyphs de mapa apenas para famílias específicas como
**Noto Sans** — o servidor de glyphs não conhece Geist Mono. Usar Geist Mono
nos labels do mapa exigiria gerar e hospedar um conjunto próprio de glyphs
`.pbf`, o que está fora do escopo deste produto.

O caráter cartográfico do mapa vem do **tratamento** tipográfico (caixa alta,
tracking largo, halo de contorno), não da família da fonte. Ver Tarefa 8 e
`docs/MAP-STRATEGY.md` para a estratégia de estilo do mapa.

---

## `cn` — utilitário de classes

`src/lib/utils/cn.ts`. Sem `clsx` nem `tailwind-merge` — duas dependências
para o que se resolve em cinco linhas. Não faz merge de classes conflitantes
porque nenhum primitivo aceita sobrescrita de cor por prop.

```ts
cn('a', condition && 'b', null, undefined) // 'a b' ou 'a'
```

---

## Primitivos de interface

Todos em `src/components/ui/`. Um arquivo por componente, uma responsabilidade
por componente. Nenhum aceita variantes ou props além das listadas aqui.

### `Button`

```ts
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline' | 'ghost' // padrão: 'outline'
  size?: 'sm' | 'md'                       // padrão: 'md'
}
```

```tsx
<Button variant="solid">Encontrar destino</Button>
```

- `solid`: fundo âmbar (`bg-accent`), texto `text-void` — ação primária.
- `outline`: borda `border-line-strong`, texto `ink` — ação secundária.
- `ghost`: sem borda, texto `ink-muted` — ação terciária/discreta.
- `disabled` reduz a opacidade para 55% mas **mantém o rótulo legível**: ações
  ainda não implementadas ficam visivelmente presentes e explicitamente
  indisponíveis, nunca ocultas em silêncio. Eram 40%, o que media 3.42:1 e
  contradizia a própria regra.
- Todo `Button` traz a classe `.press`: recuo de 2% enquanto pressionado, em
  90ms. Confirma o toque numa superfície onde o resultado pode acontecer fora do
  campo de visão — o mapa atrás do painel.

### `Chip`

```ts
interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean // padrão: false
}
```

```tsx
<Chip active={filtro === 'visitados'} onClick={() => setFiltro('visitados')}>
  Visitados
</Chip>
```

`button` real com `aria-pressed={active}`, nunca um `div` com `onClick`. Ativo
usa borda e texto âmbar; inativo usa hairline neutra.

A caixa visual tem 24px de altura — a densidade é parte da linguagem — mas a
**área clicável tem 32px**, expandida por um pseudo-elemento transparente que não
ocupa espaço no layout. A ativação em si é instantânea: um filtro é uma chave,
não um fade.

### `Toggle`

```ts
interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}
```

```tsx
<Toggle label="Mostrar visitados" checked={showVisited} onChange={setShowVisited} />
```

Checkbox nativo estilizado (`appearance-none` + estado `checked:`) — acessível
de graça, sem biblioteca de terceiros. A `<label>` inteira é o alvo e tem 32px
de altura; a caixa desenhada tem 14px.

### `Stat`

```ts
interface StatProps {
  label: string
  value: string
  unit?: string
}
```

```tsx
<Stat label="Distância" value="412" unit="km" />
```

Par label/valor no vocabulário de instrumento: `label` usa `.instrument-label`,
`value` usa `.instrument-value`. Usado na statusbar e no painel de lugar.

---

## Anti-padrões proibidos

Copiado de `CLAUDE.md` — direção visual não negociável:

- Excesso de cards
- Gradientes aleatórios
- Glassmorphism decorativo
- Arredondamento universal
- Ícones sem função (decorativos)
- Dashboards de widgets
- Sombras difusas

**Obrigatório:** raio máximo `2px`, separação por hairlines de 1px, mapa como
estrutura (nunca dentro de um card pequeno), todo dado numérico em fonte mono,
acento âmbar de instrumento.
