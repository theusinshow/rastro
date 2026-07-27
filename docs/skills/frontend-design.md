# Briefing — `/frontend-design` no Rastro

Cole este arquivo inteiro junto do pedido ao invocar `/frontend-design` para
criar uma tela ou componente novo, ou definir uma direção estética, no
Rastro.

## Produto em uma frase

O mapa é a memória visual da vida do motociclista. Vocabulário: cartas
topográficas, instrumentos de viagem, GPS outdoor, interfaces automotivas
premium — nunca dashboard SaaS.

## Tokens (valores exatos, de `docs/DESIGN-SYSTEM.md`)

Definidos em `@theme` dentro de `src/app/globals.css` — Tailwind v4 é
CSS-first, não há `tailwind.config.js`.

| Token | Valor | Uso |
|---|---|---|
| `--color-void` | `#0a0c0b` | Fundo de página |
| `--color-base` | `#101413` | Painéis e barras estruturais |
| `--color-raised` | `#171c1a` | Um nível elevado (ex.: cabeçalho de painel) |
| `--color-overlay` | `#1e2422` | Hover/ativo de superfícies neutras |
| `--color-line` | `rgba(255,255,255,0.07)` | Hairline padrão |
| `--color-line-strong` | `rgba(255,255,255,0.14)` | Hairline de controles interativos |
| `--color-ink` | `#e8edea` | Texto primário |
| `--color-ink-muted` | `#9aa5a0` | Texto secundário |
| `--color-ink-faint` | `#5e6b66` | Texto terciário |
| `--color-accent` | `#f0a32b` | Âmbar de instrumento |
| `--color-accent-dim` | `#8a5f1a` | Seleção de texto (`::selection`) |
| `--color-visited` | `#3fbf8f` | Lugar já visitado |
| `--color-wanted` | `#f0a32b` | Quero conhecer (mesmo tom do acento) |
| `--color-unvisited` | `#7d8a85` | Sem relação de visita |
| `--radius-xs` | `2px` | Teto de arredondamento do produto inteiro |

Cada token de cor gera automaticamente `bg-*`, `text-*` e `border-*`;
`--radius-xs` gera `rounded-xs`.

## Duas famílias tipográficas

- **Geist Sans** (`--font-sans`) — texto de interface. Auto-hospedada via
  `next/font/google` em `src/app/layout.tsx`.
- **Geist Mono** (`--font-mono`) — **todo** dado numérico e todo rótulo de
  instrumento, via as classes `.instrument-label` e `.instrument-value`
  (`@layer components` em `globals.css`). Texto comum nunca usa estas
  classes.

**Exceção que não deve ser "corrigida":** os labels desenhados **dentro do
mapa** usam Noto Sans, não Geist Mono — o servidor de glyphs do MapTiler só
hospeda famílias como Noto Sans. O caráter cartográfico do mapa vem do
tratamento tipográfico (caixa alta, tracking largo, halo), não da família da
fonte. Geist Mono é exclusivo do chrome HTML.

## Estrutura do shell em três faixas

```
<MapProvider>
  <TopBar />                                  ← faixa superior, h-12
  <div className="relative flex-1">
    <MapCanvas />                             ← instância única, nunca desmonta
    <div className="pointer-events-none absolute inset-0">
      {children}                              ← overlays das rotas
    </div>
  </div>
  <StatusBar />                               ← faixa inferior, h-7
</MapProvider>
```

Definido em `src/app/(app)/layout.tsx`. O mapa ocupa toda a faixa central; as
páginas nunca renderizam a si mesmas como conteúdo substituindo o mapa —
apenas overlays posicionados por cima dele.

### O padrão de overlay com `pointer-events`

O contêiner de `{children}` é `pointer-events-none` por padrão, para que
cliques no vazio cheguem ao mapa por baixo. Cada painel real reativa
`pointer-events-auto` em si mesmo — ver `OverlayPanel`
(`src/components/layout/OverlayPanel.tsx`, classe `pointer-events-auto`) e
`DiscoveryLauncher` (mesmo padrão, num botão flutuante). Um componente novo
que precise capturar clique **precisa** declarar `pointer-events-auto`
explicitamente; herdar do pai o deixaria invisível ao clique.

## API dos primitivos existentes — reutilize antes de criar componente novo

Todos em `src/components/ui/`, um arquivo por componente:

- **`Button`** — `variant?: 'solid' | 'outline' | 'ghost'` (padrão
  `'outline'`), `size?: 'sm' | 'md'` (padrão `'md'`). `disabled` reduz
  opacidade a 40% mas mantém o rótulo legível — nunca esconde uma ação ainda
  não implementada.
- **`Chip`** — `active?: boolean`. `button` real com `aria-pressed={active}`.
- **`Toggle`** — `{ label: string; checked: boolean; onChange: (checked:
  boolean) => void }`. Checkbox nativo estilizado, não um switch customizado.
- **`Stat`** — `{ label: string; value: string; unit?: string }`. Par
  label/valor no vocabulário de instrumento; `label` em `.instrument-label`,
  `value` em `.instrument-value`.

Nenhum aceita variantes ou props além das listadas. Um pedido de "botão maior
que os dois tamanhos existentes" ou "chip com ícone" é um pedido para
estender `Button`/`Chip`, não para criar um componente paralelo.

## Regra de camadas

Componente visual não calcula nada. Distância, filtro, ordenação, status de
visita derivado — tudo isso é `src/domain/` (`haversineKm`, `filterPlaces`,
`findDestinations`, `deriveVisitStatus`), função pura, testada por Vitest sem
DOM. Um componente novo recebe dados já prontos via props; se ele precisar de
um `.sort()` ou de uma conta de distância, essa lógica pertence a uma função
de domínio nova, não ao componente.

## Padrões proibidos

Excesso de cards, gradientes aleatórios, glassmorphism decorativo,
arredondamento universal, ícones sem função, dashboards de widgets, sombras
difusas.

## Antes de propor um componente novo

Verifique, nesta ordem:

1. **Nenhum primitivo existente resolve** — `Button`, `Chip`, `Toggle` ou
   `Stat` não cobrem o caso, mesmo combinados.
2. **O componente não carrega lógica de negócio** — nada de cálculo, filtro
   ou ordenação dentro dele; isso é `src/domain/`.
3. **Ele funciona sobre um fundo de mapa em movimento** — o mapa nunca para;
   qualquer overlay novo precisa de contraste e legibilidade garantidos
   contra um fundo que muda de cor conforme o usuário navega, não apenas
   contra o fundo escuro estático de uma captura de tela.
