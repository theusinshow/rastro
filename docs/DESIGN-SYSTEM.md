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
| `--color-ink-faint` | `#5e6b66` | Texto terciário (`.instrument-label`, `Chip` inativo). |

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
- `disabled` reduz a opacidade para 40% mas **mantém o rótulo legível**: ações
  ainda não implementadas ficam visivelmente presentes e explicitamente
  indisponíveis, nunca ocultas em silêncio.

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
de graça, sem biblioteca de terceiros.

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
