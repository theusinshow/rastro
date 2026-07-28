# Design system — Rastro

Este documento descreve a linguagem visual do Rastro: os tokens CSS, as regras
não negociáveis de forma e os primitivos de interface. Toda a interface do
produto — inclusive o mapa que a sustenta — é construída sobre esta base.

A direção atual é **couro e instrumento**, registrada no
[ADR 0009](./decisions/0009-direcao-visual-couro-e-instrumento.md), que
substituiu a paleta, o teto de raio e a tipografia da primeira versão.

O Rastro não pode parecer template SaaS genérico nem "AI slop". Separação vem de
hairlines, não de sombra. Cor vem de instrumento, não de gradiente. Números vêm
de mono, sempre.

---

## Tokens

Definidos em `@theme` dentro de `src/app/globals.css` (Tailwind CSS v4 é
CSS-first — não há `tailwind.config.js`). Cada token de cor gera automaticamente
as utilities `bg-*`, `text-*` e `border-*`; cada `--radius-*` gera `rounded-*`.

**Toda razão de contraste abaixo foi medida sobre `--color-base`, não estimada.**

### Superfícies

| Token | Valor | Uso |
|---|---|---|
| `--color-void` | `#14100c` | Fundo de página. Couro queimado, nunca preto puro — preto absoluto achata o mapa e mata a profundidade do relevo. |
| `--color-base` | `#1c1712` | Fundo de painéis e barras estruturais. |
| `--color-raised` | `#251e17` | Um nível acima do base. |
| `--color-overlay` | `#302620` | Hover/ativo de superfície interativa neutra. |

### Traços

| Token | Valor | Uso |
|---|---|---|
| `--color-line` | `rgba(240,228,210,0.1)` | Hairline padrão, no lugar de sombra. Tingido de areia, não de branco puro, para não esfriar a superfície. |
| `--color-line-strong` | `rgba(240,228,210,0.2)` | Hairline de controle interativo. |

### Texto

| Token | Valor | Contraste | Uso |
|---|---|---|---|
| `--color-ink` | `#f0e4d2` | 14.17:1 | Primário. |
| `--color-ink-muted` | `#bfae97` | 8.23:1 | Secundário. |
| `--color-ink-faint` | `#9a8973` | 5.25:1 | Terciário — `.instrument-label`, statusbar. |

### Acento

| Token | Valor | Contraste | Uso |
|---|---|---|---|
| `--color-accent` | `#e0a02e` | 7.82:1 | Amarelo queimado de instrumento. Botão `solid`, anel de foco, estado ativo. |
| `--color-accent-strong` | `#c9861a` | — | Hover de ação primária. |
| `--color-accent-dim` | `#6b4b12` | — | Preenchimento surdo de estado ativo. **Nunca texto.** |
| `--color-on-accent` | `#14100c` | 8.33:1 sobre o acento | Texto sobre âmbar. |

### Estados de visita — nomeiam o **dado**

| Token | Valor | Contraste |
|---|---|---|
| `--color-visited` | `#8fa36a` | 6.45:1 |
| `--color-wanted` | `#e0a02e` | 7.82:1 |
| `--color-unvisited` | `#9a8973` | 5.25:1 |

### Estados de operação — nomeiam o **resultado de uma escrita**

| Token | Valor | Contraste |
|---|---|---|
| `--color-alert` | `#d4694a` | 5.01:1 |
| `--color-warn` | `#e0a02e` | 7.82:1 |
| `--color-ok` | `#8fa36a` | 6.45:1 |

**Os dois vocabulários são separados de propósito.** Um lugar visitado não é uma
operação bem sucedida; hoje `visited` e `ok` coincidem em valor e podem divergir
amanhã sem que nada avise. Ver ADR 0009.

### Escala tipográfica

| Utilitária | Valor | Uso |
|---|---|---|
| `text-micro` | 12px / 1 | Rótulo de instrumento, statusbar, contagem |
| `text-small` | 15px / 1.5 | Dica de campo, legenda, texto terciário |
| `text-body` | **17px** / 1.55 | **Piso do corpo.** Nenhum texto corrido desce daqui |
| `text-lead` | 20px / 1.4 | Primeira linha de um painel, valor em destaque |
| `text-title` | 24px / 1.2 | Nome de lugar, título de tela |
| `text-display` | 32px / 1 | Só display |

Antes desta escala existiam **oito tamanhos arbitrários** espalhados por vinte
arquivos, escolhidos no olho um de cada vez. Um degrau novo agora exige entrar em
`@theme`, que é onde a decisão pode ser discutida.

### Escala de espaçamento

Não é escala nova: é o passo de 4px do Tailwind, **nomeado por intenção**.

| Token | Valor | Uso |
|---|---|---|
| `--space-tight` | 8px | Entre um rótulo e o seu controle |
| `--space-snug` | 12px | Entre controles irmãos |
| `--space-panel` | 20px | Respiro interno de painel |
| `--space-section` | 32px | Entre blocos de assunto diferente |

Quem escreve `px-5 py-4` num painel e `px-4 py-4` no seguinte não decidiu duas
vezes — decidiu zero vez. Painel novo lê daqui.

### Raio

| Token | Valor |
|---|---|
| `--radius-sm` | `8px` |
| `--radius-md` | `14px` |
| `--radius-lg` | `20px` |
| `--radius-xl` | `28px` |
| `--radius-2xl` | `36px` |
| `--radius-full` | `999px` |

A escala existe para que o raio seja **proporcional ao tamanho do elemento**, não
para decorar. Nada é arredondado sem razão.

### Foco, indisponível, painéis e empilhamento

Em `:root`, dentro de `@layer base`:

| Token | Valor | Uso |
|---|---|---|
| `--focus-width` / `--focus-offset` | `2px` / `3px` | Anel de foco. Aplicado a 100% dos controles, sem exceção. |
| `--disabled-opacity` | `0.45` | Indisponível, com o rótulo ainda legível. |
| `--panel-narrow` / `--panel-base` / `--panel-wide` | `232` / `340` / `420px` | Larguras de painel. O `padding` da câmera do mapa precisa bater com elas. |
| `--z-map` / `--z-map-chrome` / `--z-panel` / `--z-bar` | `0` / `10` / `20` / `30` | Empilhamento. Sem isto os controles do MapLibre (`z-index: 2` de fábrica) desenham sobre os painéis. |

### Movimento

Num bloco `@theme static` separado. `static` porque o Tailwind remove do CSS
entregue todo token de `@theme` que nenhuma regra referencia, e uma escala
precisa existir inteira mesmo quando só um degrau está em uso.

| Token | Valor | Uso |
|---|---|---|
| `--dur-instant` | `90ms` | Press. Abaixo do limiar de percepção. |
| `--dur-fast` | `140ms` | Hover, cor. |
| `--dur-base` | `220ms` | Entrada de painel, revelação de lista. |
| `--dur-slow` | `320ms` | Primeira pintura do mapa. |
| `--dur-signal` | `400ms` | Realce de valor que mudou. **Sobrevive a movimento reduzido.** |
| `--ease-out-quart` | `cubic-bezier(0.25,1,0.5,1)` | Curva padrão. Também usada pela câmera do MapLibre, em JS. |
| `--ease-out-quint` | `cubic-bezier(0.22,1,0.36,1)` | Entrada de painel e de lista. |
| `--ease-in` | `cubic-bezier(0.4,0,1,1)` | Saída. |

Regras do sistema:

- **Sem bounce, sem elastic.** Nenhuma curva ultrapassa o valor final.
- **Saída sempre ~70% da entrada** — `calc(var(--dur-base) * 0.7)`.
- **Movimento que não ajuda a compreender é decoração e não entra.** Cada
  animação responde a "o que o usuário deixa de entender sem ela?".

Dois valores de movimento **não** são tokens CSS, porque quem os consome não lê
CSS: a câmera do mapa (`src/lib/map/camera.ts` — 600/900/700ms) e a pintura dos
pins (`src/lib/map/paint.ts` — 220/240/140ms). O MapLibre desenha em WebGL.

#### Classes de movimento

Em `@layer components`, porque nenhuma tem equivalente em utilitária:

| Classe | O que faz |
|---|---|
| `.overlay-panel` | Geometria do painel e entrada/saída. Entrada por `@starting-style`; saída por `[data-exiting='true']`. |
| `.stagger-item` | Revelação escalonada, travada em 8 itens. |
| `.press` | `scale(0.98)` em `:active`. |
| `.value-changed` | Realce âmbar de 400ms em valor que mudou. |
| `.map-surface` | Fade de primeira pintura. |
| `.empty-state` | Fade com 120ms de atraso, para que uma consulta rápida com resultado nunca pisque o vazio antes. |

#### Política de `prefers-reduced-motion`

**Não usamos o `* { animation-duration: 0.01ms !important }` de manual.** Ele
mataria também a câmera do mapa, que aqui é navegação, e o crossfade dos pins,
que é a única evidência de que o recorte mudou.

1. **Removido.** Deslocamento e fade de painel, escalonamento, press, fade de
   primeira pintura. O bloco `@media` zera as durações, `--motion-shift`,
   `--stagger-step` e `--empty-delay`, e devolve `--motion-press` a `1`.
2. **Preservado.** Realce da contagem (`--dur-signal`) e crossfade dos pins.
   Carregam informação, e opacidade sem deslocamento é segura.
3. **Substituído.** `easeTo`/`flyTo`/`fitBounds` continuam, com `duration: 0`.
   Quem faz isso é o próprio MapLibre, **desde que não se passe
   `essential: true`** — nenhuma chamada do Rastro passa.

---

## Regras de forma não negociáveis

- **Hairline de 1px no lugar de sombra.** Nenhuma sombra difusa separa regiões.
- **Nenhum card contendo conteúdo primário.** O mapa é estrutura, não um widget
  dentro de uma caixa. O substituto do card é `PanelSection`: seção delimitada
  por hairline dentro de um painel.
- **Todo dado numérico usa `.instrument-value`** — mono com `tabular-nums`.
  Texto comum (nomes, descrições) nunca usa esta classe.
- **Ícone só quando substitui texto**, nunca decorando um rótulo que já diz a
  mesma coisa. O produto não tem conjunto de ícones e é melhor por isso.
- **O raio é proporcional ao elemento**, escolhido na escala — não arbitrário.

---

## Tipografia

Duas famílias, via `next/font/google` em `src/app/layout.tsx` — auto-hospedadas,
sem requisição a domínio externo em runtime:

- **Archivo** (`--font-sans`), com o eixo de largura (`wdth`) exposto.
- **JetBrains Mono** (`--font-mono`) — todo dado numérico e todo rótulo de
  instrumento.

**Piso de corpo: 17px**, com `line-height: 1.55`. O produto é lido parado no
acostamento, com luva e sol na tela.

### Classes utilitárias

| Classe | O que faz |
|---|---|
| `.instrument-label` | Mono, 12px, tracking `0.16em`, caixa alta, `ink-faint`. Carrega boa parte do caráter técnico do produto. |
| `.instrument-value` | Mono, `tabular-nums`, tracking `0.02em`. |
| `.type-display` | Archivo a `font-stretch: 125%`, peso 700, caixa alta. Só display. |
| `.type-title` | Archivo a `font-stretch: 115%`, peso 700. Títulos. |

### Nota: os labels do mapa não usam a mono do produto

O MapTiler serve glyphs apenas para famílias que ele hospeda, como Noto Sans.
O caráter cartográfico vem do **tratamento** (caixa alta, tracking largo, halo),
não da família. Ver `docs/MAP-STRATEGY.md`.

---

## `cn` — utilitário de classes

`src/lib/utils/cn.ts`. Sem `clsx` nem `tailwind-merge` — duas dependências para
o que se resolve em cinco linhas.

---

## Primitivos de interface

Todos em `src/components/ui/`. Um arquivo por responsabilidade.

### `Button`

```ts
variant?: 'solid' | 'outline' | 'ghost' | 'danger'  // padrão: 'outline'
size?: 'sm' | 'md' | 'lg'                            // padrão: 'md'
```

- `solid`: fundo âmbar, texto `on-accent` — ação primária.
- `outline`: borda `line-strong` — ação secundária.
- `ghost`: sem borda — ação terciária.
- `danger`: contorno em `alert`, preenchimento **só no hover**. Apagar não deve
  competir em peso com a ação principal do painel onde mora.
- Alturas: `sm` 40px, `md` 48px, `lg` 56px.
- Todo `Button` traz `.press`.

### `Chip`

```ts
active?: boolean
count?: number   // quantos itens o filtro deixaria no recorte
```

40px de altura, `rounded-full`. A ativação é instantânea: um filtro é uma chave,
não um fade.

### `Toggle`

```ts
label: string; checked: boolean; onChange: (checked: boolean) => void
```

Checkbox nativo estilizado — acessível de graça. Caixa de 20px, alvo de 44px.

### `Stat`

```ts
label: string; value: string; unit?: string
```

Par no vocabulário de instrumento: `label` em `.instrument-label`, `value` em
`.instrument-value`.

### `Field`, `Input`, `Select`, `Textarea`

```ts
<Field label="Nome" hint="Opcional." error={erro}>
  {(field) => <Input {...field} value={nome} onChange={…} />}
</Field>
```

`Field` usa `useId` para amarrar `<label htmlFor>`, `aria-describedby` e
`aria-invalid` ao controle — a amarração que os formulários escritos à mão não
faziam. A dica some quando há erro: dois textos de apoio sob o mesmo controle
competem, e o erro é o que precisa ser lido.

`Input` aceita `numeric`, que liga a mono tabular.

### `CloseButton`

Glifo pequeno, **alvo de 44px**. É a única saída de um painel e era o controle
mais difícil de acertar da interface (P2.6 da auditoria: 14×18px). O `×` é o caso
em que a regra "ícone só quando substitui texto" permite o glifo.

### `InlineMessage`

```ts
tone?: 'error' | 'warn' | 'info' | 'ok'   // padrão: 'info'
```

Mensagem de estado **junto do controle que falhou**. Existe porque toast está
fora do sistema, e porque antes dela toda mensagem de erro usava `ink-muted` e
era visualmente idêntica a uma legenda. `role="alert"` só no tom de erro.

### `PanelSection`, `SectionHeader`, `Divider`

`PanelSection` é o substituto do card. `SectionHeader` elimina a repetição de
cerca de doze cabeçalhos montados à mão. `Divider` é o hairline nomeado.

---

## A marca

Um **R cuja perna é uma estrada terminando num destino**. É a pergunta central do
produto — *para onde eu vou?* — desenhada.

**Um desenho só, em todos os tamanhos.** A faixa central tracejada é o que faz a
estrada ler como estrada: sem ela o traço âmbar tem a mesma espessura e a mesma
ponta do talo, e o olho vê um segundo traço da letra em vez de uma estrada.

O tracejado é desenhado **na cor do fundo**, não em osso — é asfalto cortado, não
uma linha por cima. Ele sobrevive legível até 24px.

Cores: `base` na placa, `ink` na letra, `accent` na estrada e no destino. Raio da
placa: `radius-md`.

### Onde ela aparece

| Arquivo | Uso |
|---|---|
| `src/app/icon.svg` | Favicon e aba do navegador |
| `src/app/apple-icon.png` | 180px, ícone na tela inicial do celular |
| `src/components/ui/Logo.tsx` | Dentro da interface — `TopBar` e tela `/entrar` |

```tsx
<Logo size={26} />          // TopBar — sem placa, sobre a barra
<Logo size={56} plate />    // /entrar — com placa, como elemento principal
```

**A geometria vive em dois arquivos** — o componente e `src/app/icon.svg` —
porque o Next exige arquivo estático para o favicon. Ao mexer num, mexa no outro.

> **Armadilha do `icon.svg`:** comentário XML não pode conter dois hifens
> seguidos. Escrever o nome de um token com o prefixo de variável CSS dentro do
> comentário torna o arquivo inválido, e o navegador simplesmente **para de
> desenhar o ícone** — sem erro no console, sem aviso no build, e com a tag
> `<link rel="icon">` ainda presente no `<head>`. Aconteceu, e só apareceu ao
> renderizar o arquivo de verdade.

A marca é sempre `aria-hidden`: onde ela aparece, a palavra "Rastro" aparece
junto, e anunciá-la seria repetir.

---

## Anti-padrões proibidos

- Excesso de cards, e **nenhum** card com conteúdo primário
- Gradientes
- Glassmorphism decorativo (blur só onde há mapa por trás, para legibilidade)
- Ícones decorativos
- Dashboards de widgets
- Sombras difusas
- Grade de botões de peso visual idêntico
- Toast/snackbar — erro aparece no painel
- Tooltip só de hover — sem equivalente de teclado nem de toque
- Skeleton loader — os dados vêm renderizados no servidor
- Modal — o padrão é painel lateral, que vira folha inferior abaixo de 768px
