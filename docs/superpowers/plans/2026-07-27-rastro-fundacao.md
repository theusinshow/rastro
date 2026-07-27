# Rastro — Fundação e Explore · Plano de Implementação

> **Para agentes executores:** SUB-SKILL OBRIGATÓRIA: use
> `superpowers:subagent-driven-development` (recomendado) ou
> `superpowers:executing-plans` para implementar tarefa a tarefa. Os passos usam
> checkbox (`- [ ]`) para acompanhamento.

**Objetivo:** Construir a fundação do Rastro e a tela Dashboard / Explore — mapa
full-bleed de Santa Catarina com pins de estado, painel lateral de lugar, filtros e
descoberta "Para onde vamos?", sobre dados mockados e schema Supabase versionado.

**Arquitetura:** Next.js App Router com o `<MapCanvas>` vivendo no layout do route
group `(app)`, de modo que a instância do MapLibre nunca remonta ao navegar. Toda
regra de negócio (haversine, filtros, descoberta) é função pura em `src/domain/`,
sem React. Acesso a dados atrás de uma interface `PlaceRepository`, hoje implementada
em memória. Filtros e seleção vivem na URL.

**Stack:** Next.js (App Router) · React · TypeScript strict · Tailwind CSS v4 ·
maplibre-gl · Vitest · Supabase (schema apenas nesta fase).

---

## Restrições globais

Estas valem para **todas** as tarefas. Os requisitos de cada tarefa as incluem
implicitamente.

- **CHANGELOG obrigatório.** Todo commit exige entrada em `CHANGELOG.md` sob
  `## [Não lançado]`, categorias em PT-BR (`Adicionado`, `Alterado`, `Corrigido`,
  `Removido`). Commit sem entrada = trabalho incompleto. Ver `CLAUDE.md`.
- **Definição de concluído por tarefa:** `npm run lint` sem warnings,
  `npm run typecheck` limpo, `npm test` verde, `CHANGELOG.md` atualizado.
- **TypeScript `strict`.** Nenhum `any`, nenhum `@ts-ignore`, nenhum
  `console.log` deixado para trás. Prefira `unknown` + narrowing.
- **Camadas.** `src/domain/` nunca importa React, Next, componentes ou dados.
  `src/lib/data/` importa `domain`, nunca componentes. Componentes visuais não
  calculam distância, não filtram, não ordenam.
- **Idioma.** Textos de interface em PT-BR. Identificadores, tipos, arquivos,
  tabelas e colunas em inglês.
- **Dependências.** Nenhuma instalação além das listadas na Tarefa 1 sem
  justificativa registrada em ADR. Recusadas deliberadamente: `react-map-gl`,
  bibliotecas de estado global, bibliotecas de data.
- **Direção visual.** Raio máximo `2px`. Nenhuma sombra difusa — separação por
  hairlines de 1px. Nenhum card contendo conteúdo primário. Ícone só quando
  substitui texto. Todo dado numérico em fonte mono.
- **Dados mockados.** Tudo em `src/mocks/` é dado de desenvolvimento não
  verificado, marcado com `source: 'mock'`.
- **Acessibilidade.** Todo controle interativo alcançável por teclado, com
  `:focus-visible` visível. Nenhum `div` com `onClick` no lugar de `button`.

---

## Estrutura de arquivos

Mapa do que cada arquivo é responsável, antes das tarefas.

### Domínio — regras puras, sem React

| Arquivo | Responsabilidade |
|---|---|
| `src/domain/place.ts` | Tipos `Place`, `PlaceCategory`, `VisitStatus`, `PlaceUserState`, `ExplorePlace`; derivação de status de visita |
| `src/domain/motorcycle.ts` | Tipo `Motorcycle` |
| `src/domain/trip.ts` | Tipos `Trip`, `TripStop`, `TripPhoto`, `TripStatus` (usados pelo schema e rotas stub) |
| `src/domain/geo.ts` | `Coordinates`, `haversineKm`, formatadores de coordenada / distância / duração |
| `src/domain/filters.ts` | `ExploreFilters`, `filterPlaces` |
| `src/domain/discovery.ts` | `DiscoveryQuery`, `findDestinations`, constantes de velocidade e sinuosidade |

### Dados

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/data/place-repository.ts` | Interface `PlaceRepository` |
| `src/lib/data/mock/mock-place-repository.ts` | Implementação em memória |
| `src/lib/data/index.ts` | Seleção do adapter ativo (único ponto de troca) |
| `src/mocks/places.ts` | ~14 lugares de SC + estado pessoal mockado |
| `src/mocks/motorcycles.ts` | CFMOTO IBEX 450 |
| `src/mocks/user.ts` | `DEV_USER_ID`, origem padrão (Palhoça) |

### Mapa

| Arquivo | Responsabilidade |
|---|---|
| `src/lib/map/config.ts` | Chave MapTiler, centro/zoom inicial, limites de SC |
| `src/lib/map/style.ts` | `buildRastroStyle()` — o `style.json` autoral |
| `src/lib/map/layers.ts` | IDs de camadas, expressões de cor, `buildPlacesGeoJson()` |
| `src/components/map/MapCanvas.tsx` | Monta e possui a instância do MapLibre |
| `src/components/map/map-context.tsx` | Contexto que expõe a instância aos filhos |
| `src/components/map/PlacesLayer.tsx` | Registra fonte/camadas de lugares e cliques |
| `src/components/map/MapFallback.tsx` | Estado explícito quando falta a chave |

### Layout e Explore

| Arquivo | Responsabilidade |
|---|---|
| `src/app/(app)/layout.tsx` | Shell: topbar, statusbar, mapa persistente, slot de overlay |
| `src/app/(app)/page.tsx` | Explore |
| `src/app/(app)/descobrir/page.tsx` | "Para onde vamos?" |
| `src/app/(app)/viagens/page.tsx` | Stub |
| `src/app/(app)/memorias/page.tsx` | Stub |
| `src/components/layout/TopBar.tsx` | Marca + navegação primária |
| `src/components/layout/StatusBar.tsx` | Coordenadas, zoom, contagem, origem |
| `src/components/explore/FilterRail.tsx` | Coluna de filtros |
| `src/components/explore/PlacePanel.tsx` | Painel do lugar, agnóstico de container |
| `src/components/explore/DiscoveryForm.tsx` | Formulário de descoberta |
| `src/components/explore/use-explore-filters.ts` | Lê/escreve filtros na URL |
| `src/components/ui/*` | Primitivos: `Button`, `Chip`, `Toggle`, `Field`, `Stat` |

---

## Sequência de tarefas

| # | Entrega |
|---|---|
| 1 | Scaffold, toolchain, scripts, ADR 0001 |
| 2 | Design system: tokens, fontes, primitivos, `DESIGN-SYSTEM.md` |
| 3 | Domínio: tipos e geo (TDD) |
| 4 | Domínio: filtros e descoberta (TDD) |
| 5 | Mocks + repositório (TDD) |
| 6 | Migrations SQL + `DATA-MODEL.md` + ADRs 0003/0004 |
| 7 | Shell de layout + navegação + rotas stub |
| 8 | Mapa: estilo autoral + canvas + fallback + ADR 0002 |
| 9 | Camada de pins + seleção + ADR 0005 |
| 10 | Painel do lugar |
| 11 | Filtros na URL + ADR 0006 |
| 12 | "Para onde vamos?" |
| 13 | Documentação final + briefings de skills |

Cada tarefa termina em algo executável e revisável isoladamente.

---

Tarefas detalhadas a partir da próxima seção.

---

## Tarefa 1 — Scaffold, toolchain e scripts

**Arquivos:**
- Criar: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`,
  `eslint.config.mjs`, `vitest.config.ts`, `.env.example`, `README.md`,
  `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Criar: `docs/decisions/0001-stack-e-limite-de-dependencias.md`
- Modificar: `CHANGELOG.md`

**Interfaces:**
- Produz: alias de import `@/*` → `src/*`; scripts `dev`, `build`, `lint`,
  `typecheck`, `test`, `test:watch`. Todas as tarefas seguintes dependem deles.

- [ ] **Passo 1: Criar o projeto Next.js na pasta atual**

O diretório já contém `.git`, `docs/`, `CLAUDE.md` e `CHANGELOG.md`. Use `.` como
alvo.

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

Se o CLI recusar por diretório não vazio, rode com `--force`. Depois confirme que
`CLAUDE.md`, `CHANGELOG.md`, `.gitignore` e `docs/` continuam intactos. Se
`.gitignore` foi sobrescrito, restaure com `git checkout -- .gitignore`.

- [ ] **Passo 2: Registrar as versões instaladas no ADR 0001**

Leia as versões reais que o CLI instalou:

```bash
node -p "const p=require('./package.json');JSON.stringify({...p.dependencies,...p.devDependencies},null,2)"
```

Crie `docs/decisions/0001-stack-e-limite-de-dependencias.md` contendo: contexto
(base moderna e estável, deploy na Vercel, sem acumular dependências); a decisão
(Next.js App Router, React, TypeScript strict, Tailwind v4 CSS-first, ESLint,
Vitest) com a saída real do comando acima colada como bloco de versões; e a seção
**Recusadas deliberadamente** com estas três entradas e seus motivos:

- `react-map-gl` — custa uma dependência e um modelo mental adicional para
  economizar cerca de 80 linhas de hook, ao preço de perder controle fino sobre
  camadas e expressões do MapLibre.
- Biblioteca de estado global — filtros e seleção vivem na URL (ver ADR 0006).
- Biblioteca de datas — `Intl.DateTimeFormat` cobre a necessidade atual.

Feche com: `shadcn/ui` é permitido pontualmente, apenas quando traz
acessibilidade real (primitivas Radix como popover, slider, tooltip), nunca como
fonte da estética. E com as consequências: menos código de terceiros para
auditar, em troca de mantermos integrações próprias.

- [ ] **Passo 3: Endurecer o `tsconfig.json`**

Garanta que `compilerOptions` contenha, além do que o CLI gerou:

```json
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "noImplicitOverride": true,
  "noFallthroughCasesInSwitch": true,
  "forceConsistentCasingInFileNames": true
}
```

`noUncheckedIndexedAccess` é o que impede tratar `array[0]` como sempre presente —
importante porque manipulamos coordenadas e listas de lugares o tempo todo.

- [ ] **Passo 4: Instalar MapLibre e Vitest**

```bash
npm install maplibre-gl
npm install -D vitest
```

Nenhuma outra instalação nesta tarefa.

- [ ] **Passo 5: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

Ambiente `node` porque só testamos a camada de domínio, que é pura. Nada de jsdom:
seria dependência sem uso.

- [ ] **Passo 6: Adicionar os scripts em `package.json`**

Em `"scripts"`, mantendo `dev`/`build`/`start` que o CLI criou, garanta:

```json
{
  "lint": "eslint . --max-warnings=0",
  "typecheck": "tsc --noEmit",
  "test": "vitest run --passWithNoTests",
  "test:watch": "vitest"
}
```

`--max-warnings=0` faz warning virar falha, que é o que a definição de concluído
exige. Se o scaffold gerou `"lint": "next lint"`, substitua conforme acima —
`next lint` está descontinuado nas versões recentes.

- [ ] **Passo 7: Criar `.env.example`**

```bash
# Chave da API do MapTiler — obtenha em https://cloud.maptiler.com/account/keys/
# Sem ela a aplicação exibe um estado de fallback explícito no lugar do mapa.
NEXT_PUBLIC_MAPTILER_KEY=
```

Crie também um `.env.local` com a mesma variável. Ele está no `.gitignore` e não
deve ser commitado.

- [ ] **Passo 8: Escrever o `README.md`**

Deve conter: o pitch de uma linha (Google Maps responde *"como chego lá?"*, Rastro
responde *"para onde eu vou?"*); instruções de execução (`npm install`, copiar
`.env.example` para `.env.local`, `npm run dev`); a nota de que sem a chave do
MapTiler a aplicação sobe e mostra um aviso no lugar do mapa em vez de falhar em
silêncio; tabela dos quatro comandos (`dev`, `lint`, `typecheck`, `test`); índice
apontando para `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/DATA-MODEL.md`,
`docs/MAP-STRATEGY.md`, `docs/DESIGN-SYSTEM.md`, `docs/decisions/` e
`docs/skills/`; e o aviso de que os dados em `src/mocks/` são de desenvolvimento e
não são informação verificada.

- [ ] **Passo 9: Verificar que tudo roda**

```bash
npm run lint && npm run typecheck && npm test
```

Esperado: lint e typecheck limpos; `npm test` passa sem arquivos de teste (o
primeiro nasce na Tarefa 3). Depois:

```bash
npm run dev
```

Esperado: compila e serve em `http://localhost:3000` sem erro no console. Encerre
com Ctrl+C.

- [ ] **Passo 10: Atualizar o CHANGELOG e commitar**

Em `CHANGELOG.md`, sob `## [Não lançado]` → `### Adicionado`:

```markdown
- Estrutura base do projeto com Next.js App Router, TypeScript strict, Tailwind
  CSS v4, ESLint e Vitest
- ADR 0001 registrando a stack e o limite deliberado de dependências
- README com instruções de execução e índice da documentação
```

```bash
git add -A
git commit -m "chore: scaffold do projeto e toolchain"
```

---

## Tarefa 2 — Design system

**Arquivos:**
- Modificar: `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`
- Criar: `src/lib/utils/cn.ts`, `src/components/ui/Button.tsx`,
  `src/components/ui/Chip.tsx`, `src/components/ui/Toggle.tsx`,
  `src/components/ui/Stat.tsx`
- Criar: `docs/DESIGN-SYSTEM.md`
- Modificar: `CHANGELOG.md`

**Interfaces:**
- Consome: alias `@/*` da Tarefa 1.
- Produz: tokens CSS (`--color-void`, `--color-base`, `--color-raised`,
  `--color-overlay`, `--color-line`, `--color-line-strong`, `--color-ink`,
  `--color-ink-muted`, `--color-ink-faint`, `--color-accent`, `--color-visited`,
  `--color-wanted`, `--color-unvisited`); classes `.instrument-label` e
  `.instrument-value`; `cn(...values)`; e os componentes
  `Button({variant, size, ...})`, `Chip({active, ...})`,
  `Toggle({label, checked, onChange})`, `Stat({label, value, unit})`.
  Consumidos pelas Tarefas 7, 10, 11 e 12.

- [ ] **Passo 1: Criar `src/lib/utils/cn.ts`**

Sem `clsx` nem `tailwind-merge` — duas dependências para o que resolvemos em
cinco linhas. Não fazemos merge de classes conflitantes porque nenhum primitivo
aceita sobrescrita de cor por prop.

```ts
type ClassValue = string | false | null | undefined

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ')
}
```

- [ ] **Passo 2: Escrever os tokens em `src/app/globals.css`**

Substitua todo o conteúdo gerado pelo CLI por:

```css
@import 'tailwindcss';

@theme {
  /* Superfícies — carvão levemente frio, referência de carta náutica noturna.
     Nunca preto puro: preto absoluto achata o mapa e mata a profundidade. */
  --color-void: #0a0c0b;
  --color-base: #101413;
  --color-raised: #171c1a;
  --color-overlay: #1e2422;

  /* Traços — hairlines fazem a separação estrutural no lugar de sombras */
  --color-line: rgba(255, 255, 255, 0.07);
  --color-line-strong: rgba(255, 255, 255, 0.14);

  /* Texto */
  --color-ink: #e8edea;
  --color-ink-muted: #9aa5a0;
  --color-ink-faint: #5e6b66;

  /* Acento âmbar de instrumento — painel de moto, farol, GPS outdoor.
     Deliberadamente o oposto do azul de SaaS. */
  --color-accent: #f0a32b;
  --color-accent-dim: #8a5f1a;

  /* Estados de visita */
  --color-visited: #3fbf8f;
  --color-wanted: #f0a32b;
  --color-unvisited: #7d8a85;

  /* Raio — teto de 2px. Nada aqui é arredondado por decoração. */
  --radius-xs: 2px;
}

@layer base {
  html {
    color-scheme: dark;
  }

  body {
    background-color: var(--color-void);
    color: var(--color-ink);
    -webkit-font-smoothing: antialiased;
  }

  /* Foco visível e consistente. Nenhum controle perde o anel. */
  :focus-visible {
    outline: 1px solid var(--color-accent);
    outline-offset: 2px;
  }

  ::selection {
    background-color: var(--color-accent-dim);
    color: var(--color-ink);
  }
}

@layer components {
  /* Label de instrumento: caixa alta, tracking largo, mono.
     Esta regra carrega boa parte do caráter técnico do produto. */
  .instrument-label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-ink-faint);
  }

  /* Todo dado numérico usa isto: km, coordenada, duração, zoom. */
  .instrument-value {
    font-family: var(--font-mono);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }
}
```

- [ ] **Passo 3: Carregar as fontes em `src/app/layout.tsx`**

Geist Sans e Geist Mono via `next/font/google` — zero dependência nova, e o Next
auto-hospeda os arquivos, sem requisição a domínio externo em runtime.

```tsx
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const sans = Geist({ subsets: ['latin'], variable: '--font-sans' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Rastro',
  description: 'Para onde eu vou, onde eu já estive, o que ainda quero conhecer.',
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <body style={{ fontFamily: 'var(--font-sans)' }}>{children}</body>
    </html>
  )
}
```

- [ ] **Passo 4: Criar `src/components/ui/Button.tsx`**

```tsx
import { cn } from '@/lib/utils/cn'

type ButtonVariant = 'solid' | 'outline' | 'ghost'
type ButtonSize = 'sm' | 'md'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const VARIANT: Record<ButtonVariant, string> = {
  solid: 'bg-accent text-void hover:opacity-90',
  outline:
    'border border-line-strong text-ink hover:border-accent hover:text-accent',
  ghost: 'text-ink-muted hover:text-ink hover:bg-overlay',
}

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-[11px]',
  md: 'h-9 px-4 text-xs',
}

export function Button({
  variant = 'outline',
  size = 'md',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xs font-medium',
        'uppercase tracking-[0.1em] transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        VARIANT[variant],
        SIZE[size],
        className,
      )}
      {...props}
    />
  )
}
```

O `disabled` reduz opacidade mas **mantém o rótulo legível**: ações ainda não
implementadas ficam visivelmente presentes e explicitamente indisponíveis, nunca
ocultas em silêncio.

- [ ] **Passo 5: Criar `src/components/ui/Chip.tsx`**

`button` real com `aria-pressed`, não um `div` com `onClick`.

```tsx
import { cn } from '@/lib/utils/cn'

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function Chip({ active = false, className, ...props }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'h-6 rounded-xs border px-2 text-[10px] uppercase tracking-[0.12em]',
        'transition-colors',
        active
          ? 'border-accent text-accent'
          : 'border-line text-ink-faint hover:border-line-strong hover:text-ink-muted',
        className,
      )}
      {...props}
    />
  )
}
```

- [ ] **Passo 6: Criar `src/components/ui/Toggle.tsx`**

Checkbox nativo estilizado — acessível de graça, sem Radix.

```tsx
interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-1 select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-3 w-3 appearance-none border border-line-strong
                   checked:border-accent checked:bg-accent"
      />
      <span className="text-[11px] text-ink-muted">{label}</span>
    </label>
  )
}
```

- [ ] **Passo 7: Criar `src/components/ui/Stat.tsx`**

Par label/valor no vocabulário de instrumento. Usado na statusbar e no painel.

```tsx
interface StatProps {
  label: string
  value: string
  unit?: string
}

export function Stat({ label, value, unit }: StatProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="instrument-label">{label}</span>
      <span className="instrument-value text-sm text-ink">
        {value}
        {unit ? <span className="ml-1 text-ink-faint">{unit}</span> : null}
      </span>
    </div>
  )
}
```

- [ ] **Passo 8: Trocar a home provisória**

Substitua `src/app/page.tsx` por uma verificação mínima dos tokens. Ela será
removida na Tarefa 7, quando o route group `(app)` assumir a rota `/`.

```tsx
import { Button } from '@/components/ui/Button'
import { Stat } from '@/components/ui/Stat'

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-start gap-6 p-12">
      <span className="instrument-label">Rastro · verificação de tokens</span>
      <div className="flex gap-6">
        <Stat label="Distância" value="412" unit="km" />
        <Stat label="Duração" value="8h32" />
      </div>
      <div className="flex gap-2">
        <Button variant="solid">Encontrar destino</Button>
        <Button>Quero conhecer</Button>
        <Button disabled>Criar viagem</Button>
      </div>
    </main>
  )
}
```

- [ ] **Passo 9: Verificar no navegador**

```bash
npm run dev
```

Em `http://localhost:3000`, confirme: fundo carvão e não preto puro; botão sólido
âmbar; botão desabilitado ainda legível; números em mono com largura tabular;
cantos praticamente retos. Navegue por Tab e confirme o anel de foco âmbar em
todos os controles.

- [ ] **Passo 10: Escrever `docs/DESIGN-SYSTEM.md`**

Deve conter: tabela de todos os tokens com valor e intenção de uso; a regra do
teto de 2px de raio; a regra de hairline no lugar de sombra; a regra de que todo
dado numérico usa `.instrument-value`; a API de `Button`, `Chip`, `Toggle` e
`Stat` com um exemplo cada; e a lista de anti-padrões proibidos copiada do
`CLAUDE.md`.

Inclua explicitamente esta nota: **os labels do mapa não usam Geist Mono.** O
MapTiler serve glyphs apenas de famílias como Noto Sans; usar Geist Mono no mapa
exigiria gerar e hospedar um conjunto de glyphs `.pbf` próprio. O caráter
cartográfico vem do tratamento (caixa alta, tracking largo, halo), não da família.
Ver Tarefa 8 e `docs/MAP-STRATEGY.md`.

- [ ] **Passo 11: Verificar, atualizar o CHANGELOG e commitar**

```bash
npm run lint && npm run typecheck
```

CHANGELOG, sob `### Adicionado`:

```markdown
- Design system com tokens de superfície, texto, acento âmbar e estados de visita
- Primitivos de interface: Button, Chip, Toggle e Stat
- Tipografia Geist Sans e Geist Mono auto-hospedadas via next/font
- Documentação do design system em `docs/DESIGN-SYSTEM.md`
```

```bash
git add -A
git commit -m "feat: design system com tokens e primitivos"
```

---

## Tarefa 3 — Domínio: tipos e geo

Camada pura. Nenhum import de React, Next, componentes ou dados. É o alicerce
de tipos que todas as tarefas seguintes consomem — leia as assinaturas com
atenção, elas são citadas literalmente adiante.

**Arquivos:**
- Criar: `src/domain/place.ts`, `src/domain/motorcycle.ts`, `src/domain/trip.ts`,
  `src/domain/geo.ts`, `src/domain/geo.test.ts`, `src/domain/place.test.ts`
- Modificar: `CHANGELOG.md`

**Interfaces:**
- Consome: nada.
- Produz:
  - `type PlaceCategory` (10 valores), `PLACE_CATEGORIES`, `CATEGORY_LABELS`
  - `type VisitStatus = 'nao-visitado' | 'quero-conhecer' | 'visitado'`
  - `interface Place`, `interface PlaceUserState`, `interface ExplorePlace`
  - `function deriveVisitStatus(userState: PlaceUserState): VisitStatus`
  - `function toExplorePlace(place: Place, userState: PlaceUserState): ExplorePlace`
  - `interface Coordinates { latitude: number; longitude: number }`
  - `function haversineKm(from: Coordinates, to: Coordinates): number`
  - `function formatCoordinate(value: number): string`
  - `function formatDistanceKm(km: number): string`
  - `function formatDurationMinutes(minutes: number): string`
  - `interface Motorcycle`, `interface Trip`, `interface TripStop`,
    `interface TripPhoto`, `type TripStatus`

- [ ] **Passo 1: Escrever o teste de haversine que falha**

`src/domain/geo.test.ts`. As distâncias esperadas foram derivadas da própria
fórmula sobre as coordenadas dadas; a tolerância de 1 km absorve variação de raio
terrestre entre implementações.

```ts
import { describe, expect, it } from 'vitest'
import {
  formatCoordinate,
  formatDistanceKm,
  formatDurationMinutes,
  haversineKm,
} from './geo'

const PALHOCA = { latitude: -27.6455, longitude: -48.67 }
const FLORIANOPOLIS = { latitude: -27.5954, longitude: -48.548 }

describe('haversineKm', () => {
  it('retorna zero para o mesmo ponto', () => {
    expect(haversineKm(PALHOCA, PALHOCA)).toBe(0)
  })

  it('calcula a distância entre Palhoça e Florianópolis', () => {
    expect(haversineKm(PALHOCA, FLORIANOPOLIS)).toBeCloseTo(13.2, 0)
  })

  it('é simétrico', () => {
    const ida = haversineKm(PALHOCA, FLORIANOPOLIS)
    const volta = haversineKm(FLORIANOPOLIS, PALHOCA)
    expect(ida).toBeCloseTo(volta, 6)
  })

  it('atravessa o antimeridiano pelo caminho curto', () => {
    const oeste = { latitude: 0, longitude: 179.5 }
    const leste = { latitude: 0, longitude: -179.5 }
    expect(haversineKm(oeste, leste)).toBeLessThan(120)
  })
})

describe('formatCoordinate', () => {
  it('usa quatro casas decimais e mantém o sinal', () => {
    expect(formatCoordinate(-27.6455)).toBe('-27.6455')
  })

  it('preenche casas faltantes', () => {
    expect(formatCoordinate(-27.6)).toBe('-27.6000')
  })
})

describe('formatDistanceKm', () => {
  it('arredonda para inteiro acima de 10 km', () => {
    expect(formatDistanceKm(412.4)).toBe('412')
  })

  it('mantém uma casa decimal abaixo de 10 km', () => {
    expect(formatDistanceKm(7.24)).toBe('7,2')
  })
})

describe('formatDurationMinutes', () => {
  it('formata horas e minutos', () => {
    expect(formatDurationMinutes(512)).toBe('8h32')
  })

  it('omite as horas quando não há', () => {
    expect(formatDurationMinutes(45)).toBe('45min')
  })

  it('zera os minutos com dois dígitos', () => {
    expect(formatDurationMinutes(120)).toBe('2h00')
  })
})
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```bash
npm test
```

Esperado: FALHA com erro de módulo não encontrado (`./geo`).

- [ ] **Passo 3: Implementar `src/domain/geo.ts`**

```ts
/** Ponto geográfico em graus decimais, WGS 84. */
export interface Coordinates {
  latitude: number
  longitude: number
}

const EARTH_RADIUS_KM = 6371

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180
}

/**
 * Distância em linha reta sobre a esfera, em quilômetros.
 *
 * É deliberadamente uma aproximação: não conhece estradas nem relevo. Quem
 * precisa de distância rodoviária aplica o fator de sinuosidade de
 * `discovery.ts` sobre este valor.
 */
export function haversineKm(from: Coordinates, to: Coordinates): number {
  const deltaLat = toRadians(to.latitude - from.latitude)
  const deltaLng = toRadians(to.longitude - from.longitude)
  const fromLat = toRadians(from.latitude)
  const toLat = toRadians(to.latitude)

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.sin(deltaLng / 2) ** 2 * Math.cos(fromLat) * Math.cos(toLat)

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

/** Coordenada para leitura de instrumento: sinal explícito, quatro decimais. */
export function formatCoordinate(value: number): string {
  return value.toFixed(4)
}

/** Abaixo de 10 km a casa decimal informa; acima dela, só polui. */
export function formatDistanceKm(km: number): string {
  if (km < 10) {
    return km.toFixed(1).replace('.', ',')
  }
  return Math.round(km).toString()
}

/** `512` → `8h32`; `45` → `45min`; `120` → `2h00`. */
export function formatDurationMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  const hours = Math.floor(total / 60)
  const rest = total % 60

  if (hours === 0) {
    return `${rest}min`
  }
  return `${hours}h${rest.toString().padStart(2, '0')}`
}
```

O uso de `Math.asin` com `Math.min(1, …)` em vez de `Math.atan2` evita `NaN` por
erro de ponto flutuante quando os dois pontos são idênticos — é o que faz o
primeiro teste retornar exatamente `0`.

- [ ] **Passo 4: Rodar e confirmar que passa**

```bash
npm test
```

Esperado: todos os testes de `geo.test.ts` verdes.

- [ ] **Passo 5: Escrever o teste de derivação de status**

`src/domain/place.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { deriveVisitStatus, toExplorePlace } from './place'
import type { Place, PlaceUserState } from './place'

const PLACE: Place = {
  id: 'p1',
  slug: 'serra-do-rio-do-rastro',
  name: 'Serra do Rio do Rastro',
  description: 'Descida em curvas fechadas sobre o paredão.',
  latitude: -28.39,
  longitude: -49.54,
  municipality: 'Bom Jardim da Serra',
  stateCode: 'SC',
  category: 'serra',
  tags: ['curvas', 'mirante'],
  coverImageUrl: null,
  source: 'mock',
}

function userState(overrides: Partial<PlaceUserState> = {}): PlaceUserState {
  return {
    placeId: 'p1',
    isFavorite: false,
    wantsToVisit: false,
    personalNotes: null,
    rating: null,
    lastVisitedAt: null,
    visitCount: 0,
    photoCount: 0,
    ...overrides,
  }
}

describe('deriveVisitStatus', () => {
  it('é não visitado sem visitas e sem interesse', () => {
    expect(deriveVisitStatus(userState())).toBe('nao-visitado')
  })

  it('é quero conhecer quando marcado e ainda não visitado', () => {
    expect(deriveVisitStatus(userState({ wantsToVisit: true }))).toBe(
      'quero-conhecer',
    )
  })

  it('visita vence interesse: já fui, então está visitado', () => {
    const state = userState({ wantsToVisit: true, visitCount: 2 })
    expect(deriveVisitStatus(state)).toBe('visitado')
  })
})

describe('toExplorePlace', () => {
  it('achata lugar e estado pessoal em um único modelo de leitura', () => {
    const result = toExplorePlace(
      PLACE,
      userState({ isFavorite: true, visitCount: 1, photoCount: 12 }),
    )

    expect(result.slug).toBe('serra-do-rio-do-rastro')
    expect(result.visitStatus).toBe('visitado')
    expect(result.isFavorite).toBe(true)
    expect(result.photoCount).toBe(12)
  })
})
```

- [ ] **Passo 6: Rodar e confirmar que falha**

```bash
npm test
```

Esperado: FALHA com módulo `./place` não encontrado.

- [ ] **Passo 7: Implementar `src/domain/place.ts`**

```ts
export const PLACE_CATEGORIES = [
  'serra',
  'praia',
  'mirante',
  'natureza',
  'cachoeira',
  'estrada',
  'cidade',
  'cafe',
  'restaurante',
  'ponto_turistico',
] as const

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number]

/** Rótulos em PT-BR. O código fala inglês; a interface fala português. */
export const CATEGORY_LABELS: Record<PlaceCategory, string> = {
  serra: 'Serra',
  praia: 'Praia',
  mirante: 'Mirante',
  natureza: 'Natureza',
  cachoeira: 'Cachoeira',
  estrada: 'Estrada',
  cidade: 'Cidade',
  cafe: 'Café',
  restaurante: 'Restaurante',
  ponto_turistico: 'Ponto turístico',
}

export type PlaceSource = 'mock' | 'manual' | 'imported'

/**
 * Fato objetivo sobre um lugar. Compartilhável entre usuários.
 *
 * Nada aqui é opinião: favorito, visitado e nota pessoal vivem em
 * `PlaceUserState`. Ver ADR 0003.
 *
 * Não há campo de distância nem de tempo estimado: ambos dependem da origem de
 * quem consulta e são calculados em tempo de leitura.
 */
export interface Place {
  id: string
  slug: string
  name: string
  description: string
  latitude: number
  longitude: number
  municipality: string
  /** Unidade federativa, ex.: `'SC'`. */
  stateCode: string
  category: PlaceCategory
  tags: string[]
  coverImageUrl: string | null
  source: PlaceSource
}

/** Vínculo entre um usuário e um lugar. */
export interface PlaceUserState {
  placeId: string
  isFavorite: boolean
  wantsToVisit: boolean
  personalNotes: string | null
  /** Opinião geral e atual sobre o lugar, 1 a 5. */
  rating: number | null
  /** Cache derivado de `place_visits`, mantido por trigger no banco. */
  lastVisitedAt: string | null
  visitCount: number
  photoCount: number
}

export type VisitStatus = 'nao-visitado' | 'quero-conhecer' | 'visitado'

/**
 * Eixo primário de leitura do pin. Mutuamente exclusivo por construção.
 *
 * Ter visitado vence ter marcado interesse: se já fui, o lugar está visitado,
 * mesmo que a marcação de "quero conhecer" nunca tenha sido removida.
 */
export function deriveVisitStatus(userState: PlaceUserState): VisitStatus {
  if (userState.visitCount > 0) return 'visitado'
  if (userState.wantsToVisit) return 'quero-conhecer'
  return 'nao-visitado'
}

/**
 * Modelo de leitura consumido pelo mapa, pelos filtros e pelo painel.
 *
 * Achatar aqui, uma vez, evita que cada componente precise entender a separação
 * entre catálogo e estado pessoal.
 */
export interface ExplorePlace extends Place {
  visitStatus: VisitStatus
  isFavorite: boolean
  photoCount: number
  lastVisitedAt: string | null
}

export function toExplorePlace(
  place: Place,
  userState: PlaceUserState,
): ExplorePlace {
  return {
    ...place,
    visitStatus: deriveVisitStatus(userState),
    isFavorite: userState.isFavorite,
    photoCount: userState.photoCount,
    lastVisitedAt: userState.lastVisitedAt,
  }
}
```

- [ ] **Passo 8: Rodar e confirmar que passa**

```bash
npm test
```

Esperado: todos verdes, `geo.test.ts` e `place.test.ts`.

- [ ] **Passo 9: Criar `src/domain/motorcycle.ts`**

```ts
export interface Motorcycle {
  id: string
  userId: string
  make: string
  model: string
  year: number | null
  nickname: string | null
  isDefault: boolean
  odometerKm: number | null
}

/** `'CFMOTO IBEX 450'` — usado em cabeçalhos de viagem e memórias. */
export function motorcycleLabel(motorcycle: Motorcycle): string {
  return `${motorcycle.make} ${motorcycle.model}`
}
```

- [ ] **Passo 10: Criar `src/domain/trip.ts`**

Os tipos de viagem existem agora para que o schema, as rotas stub e a futura
timeline compartilhem um vocabulário único. Nenhuma tela os consome nesta fase.

```ts
import type { Coordinates } from './geo'

export type TripStatus = 'planned' | 'ongoing' | 'completed'

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  planned: 'Planejada',
  ongoing: 'Em andamento',
  completed: 'Concluída',
}

export type TripStopKind =
  | 'start'
  | 'waypoint'
  | 'destination'
  | 'fuel'
  | 'meal'

export interface TripStop {
  id: string
  tripId: string
  placeId: string | null
  orderIndex: number
  label: string
  coordinates: Coordinates
  kind: TripStopKind
  arrivedAt: string | null
  notes: string | null
}

export interface TripPhoto {
  id: string
  tripId: string
  userId: string
  placeId: string | null
  storagePath: string
  width: number | null
  height: number | null
  /** Preenchido a partir de EXIF quando disponível. Não lemos EXIF ainda. */
  coordinates: Coordinates | null
  takenAt: string | null
  caption: string | null
  sortIndex: number
}

export interface Trip {
  id: string
  userId: string
  motorcycleId: string | null
  title: string
  slug: string
  status: TripStatus
  startedAt: string | null
  endedAt: string | null
  originLabel: string | null
  originCoordinates: Coordinates | null
  primaryPlaceId: string | null
  distanceKm: number | null
  durationMinutes: number | null
  /** Avaliação da viagem como um todo, distinta da nota do lugar. */
  rating: number | null
  notes: string | null
}
```

- [ ] **Passo 11: Verificar, atualizar o CHANGELOG e commitar**

```bash
npm run lint && npm run typecheck && npm test
```

Se o script `test` ainda tiver `--passWithNoTests`, remova-o agora — já existem
testes e a flag mascararia uma suíte quebrada.

CHANGELOG, sob `### Adicionado`:

```markdown
- Camada de domínio com tipos de lugar, moto e viagem, sem dependência de UI
- Cálculo de distância por haversine e formatadores de coordenada, distância e
  duração, cobertos por testes
- Derivação de status de visita a partir do estado pessoal do lugar
```

```bash
git add -A
git commit -m "feat: camada de dominio com tipos e calculo geografico"
```

---

## Tarefa 4 — Domínio: filtros e descoberta

Ainda camada pura. Aqui vive toda a regra de negócio do Explore e do "Para onde
vamos?". Nenhum componente pode reimplementar nada disto.

**Arquivos:**
- Criar: `src/domain/filters.ts`, `src/domain/filters.test.ts`,
  `src/domain/discovery.ts`, `src/domain/discovery.test.ts`
- Modificar: `CHANGELOG.md`

**Interfaces:**
- Consome: `ExplorePlace`, `PlaceCategory`, `VisitStatus` de `@/domain/place`;
  `Coordinates`, `haversineKm` de `@/domain/geo`.
- Produz:
  - `interface ExploreFilters`, `DEFAULT_EXPLORE_FILTERS`
  - `function filterPlaces(places, filters, origin): ExplorePlace[]`
  - `const RADIUS_OPTIONS_KM: readonly number[]`
  - `type TimeBudget`, `TIME_BUDGET_MINUTES`, `TIME_BUDGET_LABELS`
  - `AVERAGE_SPEED_KMH`, `ROAD_SINUOSITY_FACTOR`, `RIDING_TIME_RATIO`
  - `interface DiscoveryQuery`, `interface DiscoveryResult`
  - `function findDestinations(places, query): DiscoveryResult[]`

### Duas noções de distância — decisão explícita

O produto usa duas medidas diferentes de propósito, e elas **não** devem ser
unificadas:

| Onde | Medida | Por quê |
|---|---|---|
| Filtro de raio no Explore | Linha reta (`haversineKm`) | Um raio desenhado sobre o mapa *é* linha reta. Fingir que é rodoviário mentiria sobre o círculo que o usuário vê. |
| Descoberta | Rodoviária estimada (linha reta × sinuosidade) | "Quero rodar no máximo 150 km" é uma afirmação sobre estrada, não sobre o vôo do pássaro. |

- [ ] **Passo 1: Escrever o teste de filtros que falha**

`src/domain/filters.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { DEFAULT_EXPLORE_FILTERS, filterPlaces } from './filters'
import type { ExplorePlace } from './place'

const ORIGIN = { latitude: -27.6455, longitude: -48.67 }

function place(overrides: Partial<ExplorePlace>): ExplorePlace {
  return {
    id: 'x',
    slug: 'x',
    name: 'X',
    description: '',
    latitude: -27.6455,
    longitude: -48.67,
    municipality: 'Palhoça',
    stateCode: 'SC',
    category: 'serra',
    tags: [],
    coverImageUrl: null,
    source: 'mock',
    visitStatus: 'nao-visitado',
    isFavorite: false,
    photoCount: 0,
    lastVisitedAt: null,
    ...overrides,
  }
}

describe('filterPlaces', () => {
  it('sem filtros, devolve tudo', () => {
    const places = [place({ id: 'a' }), place({ id: 'b', category: 'praia' })]
    expect(filterPlaces(places, DEFAULT_EXPLORE_FILTERS, ORIGIN)).toHaveLength(2)
  })

  it('filtra por categoria, aceitando qualquer uma das selecionadas', () => {
    const places = [
      place({ id: 'a', category: 'serra' }),
      place({ id: 'b', category: 'praia' }),
      place({ id: 'c', category: 'cafe' }),
    ]
    const result = filterPlaces(
      places,
      { ...DEFAULT_EXPLORE_FILTERS, categories: ['serra', 'praia'] },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['a', 'b'])
  })

  it('filtra por raio em linha reta a partir da origem', () => {
    const perto = place({ id: 'perto' })
    const longe = place({ id: 'longe', latitude: -28.39, longitude: -49.54 })
    const result = filterPlaces(
      [perto, longe],
      { ...DEFAULT_EXPLORE_FILTERS, radiusKm: 50 },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['perto'])
  })

  it('filtra por status de visita', () => {
    const places = [
      place({ id: 'a', visitStatus: 'visitado' }),
      place({ id: 'b', visitStatus: 'nao-visitado' }),
    ]
    const result = filterPlaces(
      places,
      { ...DEFAULT_EXPLORE_FILTERS, visitStatus: ['nao-visitado'] },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['b'])
  })

  it('filtra apenas favoritos quando marcado', () => {
    const places = [
      place({ id: 'a', isFavorite: true }),
      place({ id: 'b', isFavorite: false }),
    ]
    const result = filterPlaces(
      places,
      { ...DEFAULT_EXPLORE_FILTERS, favoritesOnly: true },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['a'])
  })

  it('combina filtros com E, não com OU', () => {
    const places = [
      place({ id: 'a', category: 'serra', isFavorite: true }),
      place({ id: 'b', category: 'serra', isFavorite: false }),
      place({ id: 'c', category: 'praia', isFavorite: true }),
    ]
    const result = filterPlaces(
      places,
      { ...DEFAULT_EXPLORE_FILTERS, categories: ['serra'], favoritesOnly: true },
      ORIGIN,
    )
    expect(result.map((p) => p.id)).toEqual(['a'])
  })

  it('não muta o array recebido', () => {
    const places = [place({ id: 'a' })]
    filterPlaces(places, { ...DEFAULT_EXPLORE_FILTERS, radiusKm: 1 }, ORIGIN)
    expect(places).toHaveLength(1)
  })
})
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```bash
npm test
```

Esperado: FALHA, módulo `./filters` não encontrado.

- [ ] **Passo 3: Implementar `src/domain/filters.ts`**

```ts
import { haversineKm, type Coordinates } from './geo'
import type { ExplorePlace, PlaceCategory, VisitStatus } from './place'

/** Opções de raio oferecidas na interface, em quilômetros. */
export const RADIUS_OPTIONS_KM = [50, 100, 150, 300] as const

/**
 * Filtros do Explore.
 *
 * Listas vazias significam "sem restrição", não "nenhum resultado". É a
 * interpretação que casa com a interface: nada selecionado = mostrar tudo.
 */
export interface ExploreFilters {
  categories: PlaceCategory[]
  /** Linha reta a partir da origem. `null` = sem limite. */
  radiusKm: number | null
  visitStatus: VisitStatus[]
  favoritesOnly: boolean
}

export const DEFAULT_EXPLORE_FILTERS: ExploreFilters = {
  categories: [],
  radiusKm: null,
  visitStatus: [],
  favoritesOnly: false,
}

/** Todos os critérios são combinados com E. Retorna um novo array. */
export function filterPlaces(
  places: readonly ExplorePlace[],
  filters: ExploreFilters,
  origin: Coordinates,
): ExplorePlace[] {
  return places.filter((place) => {
    if (
      filters.categories.length > 0 &&
      !filters.categories.includes(place.category)
    ) {
      return false
    }

    if (
      filters.visitStatus.length > 0 &&
      !filters.visitStatus.includes(place.visitStatus)
    ) {
      return false
    }

    if (filters.favoritesOnly && !place.isFavorite) {
      return false
    }

    if (filters.radiusKm !== null && haversineKm(origin, place) > filters.radiusKm) {
      return false
    }

    return true
  })
}
```

`haversineKm(origin, place)` funciona porque `ExplorePlace` já satisfaz
estruturalmente `Coordinates` — tem `latitude` e `longitude`. Não há conversão.

- [ ] **Passo 4: Rodar e confirmar que passa**

```bash
npm test
```

- [ ] **Passo 5: Escrever o teste de descoberta que falha**

`src/domain/discovery.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { findDestinations } from './discovery'
import type { DiscoveryQuery } from './discovery'
import type { ExplorePlace } from './place'

const ORIGIN = { latitude: -27.6455, longitude: -48.67 }

function place(overrides: Partial<ExplorePlace>): ExplorePlace {
  return {
    id: 'x',
    slug: 'x',
    name: 'X',
    description: '',
    latitude: -27.6455,
    longitude: -48.67,
    municipality: 'Palhoça',
    stateCode: 'SC',
    category: 'serra',
    tags: [],
    coverImageUrl: null,
    source: 'mock',
    visitStatus: 'nao-visitado',
    isFavorite: false,
    photoCount: 0,
    lastVisitedAt: null,
    ...overrides,
  }
}

function query(overrides: Partial<DiscoveryQuery> = {}): DiscoveryQuery {
  return {
    origin: ORIGIN,
    timeBudget: 'dia-inteiro',
    maxDistanceKm: 300,
    categories: [],
    onlyUnvisited: false,
    onlyFavorites: false,
    ...overrides,
  }
}

describe('findDestinations', () => {
  it('descarta o que passa do limite de distância rodoviária', () => {
    const perto = place({ id: 'perto', latitude: -27.7, longitude: -48.7 })
    const longe = place({ id: 'longe', latitude: -28.39, longitude: -49.54 })
    const result = findDestinations([perto, longe], query({ maxDistanceKm: 50 }))
    expect(result.map((r) => r.place.id)).toEqual(['perto'])
  })

  it('descarta o que não cabe no tempo disponível, considerando a volta', () => {
    const distante = place({ id: 'distante', latitude: -28.39, longitude: -49.54 })
    const result = findDestinations(
      [distante],
      query({ timeBudget: '2h', maxDistanceKm: 300 }),
    )
    expect(result).toHaveLength(0)
  })

  it('ordena do mais distante ao mais próximo entre os que cabem', () => {
    const a = place({ id: 'a', latitude: -27.7, longitude: -48.7 })
    const b = place({ id: 'b', latitude: -28.02, longitude: -49.0 })
    const result = findDestinations([a, b], query())
    expect(result.map((r) => r.place.id)).toEqual(['b', 'a'])
  })

  it('respeita somente não visitados', () => {
    const places = [
      place({ id: 'a', visitStatus: 'visitado' }),
      place({ id: 'b', visitStatus: 'nao-visitado' }),
      place({ id: 'c', visitStatus: 'quero-conhecer' }),
    ]
    const result = findDestinations([...places], query({ onlyUnvisited: true }))
    expect(result.map((r) => r.place.id).sort()).toEqual(['b', 'c'])
  })

  it('respeita somente favoritos', () => {
    const places = [
      place({ id: 'a', isFavorite: true }),
      place({ id: 'b', isFavorite: false }),
    ]
    const result = findDestinations(places, query({ onlyFavorites: true }))
    expect(result.map((r) => r.place.id)).toEqual(['a'])
  })

  it('estima estrada maior que a linha reta', () => {
    const destino = place({ id: 'd', latitude: -28.02, longitude: -49.0 })
    const [result] = findDestinations([destino], query())
    expect(result).toBeDefined()
    expect(result!.estimatedRoadKm).toBeGreaterThan(result!.straightLineKm)
  })

  it('devolve lista vazia sem lugares', () => {
    expect(findDestinations([], query())).toEqual([])
  })
})
```

- [ ] **Passo 6: Rodar e confirmar que falha**

```bash
npm test
```

Esperado: FALHA, módulo `./discovery` não encontrado.

- [ ] **Passo 7: Implementar `src/domain/discovery.ts`**

```ts
import { haversineKm, type Coordinates } from './geo'
import type { ExplorePlace, PlaceCategory } from './place'

/**
 * Velocidade média realista para estrada catarinense de serra e litoral,
 * já descontando trechos urbanos e curvas. Não é velocidade de cruzeiro.
 */
export const AVERAGE_SPEED_KMH = 55

/**
 * Estrada real é mais longa que a linha reta. 1,35 é um fator conservador
 * para a região; em serra o valor real é maior, e é por isso que este número
 * existe nomeado e num lugar só, pronto para ser calibrado com dados reais.
 */
export const ROAD_SINUOSITY_FACTOR = 1.35

/**
 * Fração do tempo disponível efetivamente gasta pilotando.
 *
 * Quatro horas disponíveis não significam quatro horas na sela: há parada para
 * foto, café, combustível e o tempo no próprio destino. Sem isto, a descoberta
 * sugeriria viagens que consomem o dia inteiro e voltam no escuro.
 */
export const RIDING_TIME_RATIO = 0.75

export type TimeBudget = '2h' | '4h' | '6h' | 'dia-inteiro'

export const TIME_BUDGET_MINUTES: Record<TimeBudget, number> = {
  '2h': 120,
  '4h': 240,
  '6h': 360,
  'dia-inteiro': 600,
}

export const TIME_BUDGET_LABELS: Record<TimeBudget, string> = {
  '2h': '2 horas',
  '4h': '4 horas',
  '6h': '6 horas',
  'dia-inteiro': 'Dia inteiro',
}

export interface DiscoveryQuery {
  origin: Coordinates
  timeBudget: TimeBudget
  /** Limite de distância rodoviária estimada, só de ida. */
  maxDistanceKm: number
  /** Vazio significa qualquer categoria. */
  categories: PlaceCategory[]
  onlyUnvisited: boolean
  onlyFavorites: boolean
}

export interface DiscoveryResult {
  place: ExplorePlace
  straightLineKm: number
  estimatedRoadKm: number
  /** Ida e volta, sem contar o tempo parado no destino. */
  estimatedRoundTripMinutes: number
}

/**
 * Algoritmo v1, deliberadamente simples e explicável.
 *
 * Sem IA, sem roteamento real, sem serviço externo: filtra por interesse,
 * estima distância e tempo, descarta o que não cabe e ordena.
 *
 * A ordenação é do mais distante ao mais próximo entre os que cabem. A razão é
 * de produto: quem tem seis horas e pergunta para onde ir não quer o café da
 * esquina — quer o destino mais interessante que ainda cabe no dia.
 */
export function findDestinations(
  places: readonly ExplorePlace[],
  query: DiscoveryQuery,
): DiscoveryResult[] {
  const ridingBudgetMinutes =
    TIME_BUDGET_MINUTES[query.timeBudget] * RIDING_TIME_RATIO

  const results: DiscoveryResult[] = []

  for (const place of places) {
    if (
      query.categories.length > 0 &&
      !query.categories.includes(place.category)
    ) {
      continue
    }

    if (query.onlyUnvisited && place.visitStatus === 'visitado') continue
    if (query.onlyFavorites && !place.isFavorite) continue

    const straightLineKm = haversineKm(query.origin, place)
    const estimatedRoadKm = straightLineKm * ROAD_SINUOSITY_FACTOR

    if (estimatedRoadKm > query.maxDistanceKm) continue

    const estimatedRoundTripMinutes =
      ((estimatedRoadKm * 2) / AVERAGE_SPEED_KMH) * 60

    if (estimatedRoundTripMinutes > ridingBudgetMinutes) continue

    results.push({
      place,
      straightLineKm,
      estimatedRoadKm,
      estimatedRoundTripMinutes,
    })
  }

  return results.sort((a, b) => b.estimatedRoadKm - a.estimatedRoadKm)
}
```

- [ ] **Passo 8: Rodar e confirmar que passa**

```bash
npm test
```

Esperado: todas as suítes verdes.

- [ ] **Passo 9: Verificar, atualizar o CHANGELOG e commitar**

```bash
npm run lint && npm run typecheck && npm test
```

CHANGELOG, sob `### Adicionado`:

```markdown
- Filtros de exploração por categoria, raio, status de visita e favoritos, como
  funções puras cobertas por testes
- Algoritmo de descoberta que estima distância rodoviária e tempo de ida e volta
  a partir do tempo disponível, reservando margem para paradas
```

```bash
git add -A
git commit -m "feat: filtros e algoritmo de descoberta no dominio"
```

---

## Tarefa 5 — Dados de desenvolvimento e repositório

**Arquivos:**
- Criar: `src/mocks/user.ts`, `src/mocks/motorcycles.ts`, `src/mocks/places.ts`
- Criar: `src/lib/data/place-repository.ts`,
  `src/lib/data/mock/mock-place-repository.ts`, `src/lib/data/index.ts`,
  `src/lib/data/mock/mock-place-repository.test.ts`
- Modificar: `CHANGELOG.md`

**Interfaces:**
- Consome: `Place`, `PlaceUserState`, `ExplorePlace`, `toExplorePlace` de
  `@/domain/place`; `Motorcycle` de `@/domain/motorcycle`; `Coordinates` de
  `@/domain/geo`.
- Produz:
  - `DEV_USER_ID: string`, `DEFAULT_ORIGIN: Coordinates`,
    `DEFAULT_ORIGIN_LABEL: string`
  - `MOCK_PLACES: Place[]`, `MOCK_PLACE_USER_STATES: PlaceUserState[]`
  - `MOCK_MOTORCYCLES: Motorcycle[]`
  - `interface PlaceRepository { listExplorePlaces(): Promise<ExplorePlace[]>;
    getBySlug(slug: string): Promise<ExplorePlace | null> }`
  - `placeRepository: PlaceRepository` (exportado de `@/lib/data`)

### Sobre categorias sem dados

Os mocks cobrem lugares geográficos e cidades — fatos verificáveis. **Não
inventamos cafés nem restaurantes**: nomear um estabelecimento real com nota e
descrição fictícias produziria dados que parecem verdadeiros e não são. As
categorias `cafe` e `restaurante` seguem existindo no filtro e simplesmente
retornam vazio, o que também exercita o estado vazio da interface — algo que
precisamos ver funcionando de qualquer forma.

- [ ] **Passo 1: Criar `src/mocks/user.ts`**

```ts
import type { Coordinates } from '@/domain/geo'

/**
 * Usuário único desta fase. Existe para que toda linha de dado já carregue um
 * `userId` real desde o início, tornando a migração para multiusuário uma troca
 * de origem do id — e não uma migração de schema.
 */
export const DEV_USER_ID = '00000000-0000-4000-8000-000000000001'

/** Palhoça, Grande Florianópolis. Origem padrão de distâncias e descoberta. */
export const DEFAULT_ORIGIN: Coordinates = {
  latitude: -27.6455,
  longitude: -48.67,
}

export const DEFAULT_ORIGIN_LABEL = 'Palhoça, SC'
```

- [ ] **Passo 2: Criar `src/mocks/motorcycles.ts`**

```ts
import type { Motorcycle } from '@/domain/motorcycle'
import { DEV_USER_ID } from './user'

export const MOCK_MOTORCYCLES: Motorcycle[] = [
  {
    id: 'moto-ibex-450',
    userId: DEV_USER_ID,
    make: 'CFMOTO',
    model: 'IBEX 450',
    year: null,
    nickname: null,
    isDefault: true,
    odometerKm: null,
  },
]
```

`year` e `odometerKm` ficam `null` porque não são conhecidos — preenchê-los com
números plausíveis seria inventar dado sobre a moto real do usuário.

- [ ] **Passo 3: Criar `src/mocks/places.ts`**

O arquivo abre com o aviso e mantém catálogo e estado pessoal em listas
separadas, espelhando `places` e `place_user_states` do banco.

```ts
/**
 * DADOS DE DESENVOLVIMENTO — NÃO SÃO INFORMAÇÃO VERIFICADA.
 *
 * As coordenadas são aproximadas e servem apenas para posicionar pins durante o
 * desenvolvimento da interface. Descrições são resumidas e não conferidas.
 * Nenhum valor aqui deve ser apresentado ao usuário como fato, nem usado para
 * decidir uma viagem real.
 *
 * Quando houver dados verificados, substitua este arquivo e troque `source`
 * de `'mock'` para `'manual'` ou `'imported'`.
 *
 * Catálogo e estado pessoal ficam separados de propósito, espelhando as tabelas
 * `places` e `place_user_states`. Ver ADR 0003.
 */
import type { Place, PlaceUserState } from '@/domain/place'

export const MOCK_PLACES: Place[] = [
  {
    id: 'pl-serra-do-rio-do-rastro',
    slug: 'serra-do-rio-do-rastro',
    name: 'Serra do Rio do Rastro',
    description:
      'Descida em curvas fechadas sobre o paredão, com mirante no alto da serra.',
    latitude: -28.39,
    longitude: -49.54,
    municipality: 'Bom Jardim da Serra',
    stateCode: 'SC',
    category: 'serra',
    tags: ['curvas', 'mirante', 'icônico'],
    coverImageUrl: null,
    source: 'mock',
  },
  {
    id: 'pl-morro-da-igreja',
    slug: 'morro-da-igreja',
    name: 'Morro da Igreja',
    description: 'Ponto habitado mais alto do sul do país, com a Pedra Furada.',
    latitude: -28.1247,
    longitude: -49.4736,
    municipality: 'Urubici',
    stateCode: 'SC',
    category: 'mirante',
    tags: ['altitude', 'frio'],
    coverImageUrl: null,
    source: 'mock',
  },
  {
    id: 'pl-serra-do-corvo-branco',
    slug: 'serra-do-corvo-branco',
    name: 'Serra do Corvo Branco',
    description: 'Corte de rocha em paredões verticais ligando serra e litoral.',
    latitude: -28.17,
    longitude: -49.34,
    municipality: 'Grão-Pará',
    stateCode: 'SC',
    category: 'serra',
    tags: ['corte de rocha', 'estrada'],
    coverImageUrl: null,
    source: 'mock',
  },
  {
    id: 'pl-urubici',
    slug: 'urubici',
    name: 'Urubici',
    description: 'Base da serra catarinense, ponto de apoio para a região alta.',
    latitude: -28.0154,
    longitude: -49.592,
    municipality: 'Urubici',
    stateCode: 'SC',
    category: 'cidade',
    tags: ['apoio', 'serra'],
    coverImageUrl: null,
    source: 'mock',
  },
  {
    id: 'pl-cascata-do-avencal',
    slug: 'cascata-do-avencal',
    name: 'Cascata do Avencal',
    description: 'Queda alta em anfiteatro de rocha, próxima a Urubici.',
    latitude: -28.05,
    longitude: -49.5,
    municipality: 'Urubici',
    stateCode: 'SC',
    category: 'cachoeira',
    tags: ['cachoeira'],
    coverImageUrl: null,
    source: 'mock',
  },
  {
    id: 'pl-guarda-do-embau',
    slug: 'guarda-do-embau',
    name: 'Guarda do Embaú',
    description: 'Vila de surf na foz do rio da Madre, com travessia de barco.',
    latitude: -27.8967,
    longitude: -48.5828,
    municipality: 'Palhoça',
    stateCode: 'SC',
    category: 'praia',
    tags: ['surf', 'rio'],
    coverImageUrl: null,
    source: 'mock',
  },
  {
    id: 'pl-praia-da-pinheira',
    slug: 'praia-da-pinheira',
    name: 'Praia da Pinheira',
    description: 'Faixa longa de areia entre costões, no sul da Grande Florianópolis.',
    latitude: -27.87,
    longitude: -48.59,
    municipality: 'Palhoça',
    stateCode: 'SC',
    category: 'praia',
    tags: ['costão'],
    coverImageUrl: null,
    source: 'mock',
  },
  {
    id: 'pl-rancho-queimado',
    slug: 'rancho-queimado',
    name: 'Rancho Queimado',
    description: 'Cidade de altitude na serra do interior, clima ameno o ano todo.',
    latitude: -27.6717,
    longitude: -49.0164,
    municipality: 'Rancho Queimado',
    stateCode: 'SC',
    category: 'cidade',
    tags: ['altitude', 'bate-volta'],
    coverImageUrl: null,
    source: 'mock',
  },
  {
    id: 'pl-santo-amaro-da-imperatriz',
    slug: 'santo-amaro-da-imperatriz',
    name: 'Santo Amaro da Imperatriz',
    description: 'Vale de águas termais no pé da Serra do Tabuleiro.',
    latitude: -27.6875,
    longitude: -48.7789,
    municipality: 'Santo Amaro da Imperatriz',
    stateCode: 'SC',
    category: 'natureza',
    tags: ['termas', 'vale'],
    coverImageUrl: null,
    source: 'mock',
  },
  {
    id: 'pl-garopaba',
    slug: 'garopaba',
    name: 'Garopaba',
    description: 'Vila litorânea entre morros, com enseadas abrigadas.',
    latitude: -28.0272,
    longitude: -48.618,
    municipality: 'Garopaba',
    stateCode: 'SC',
    category: 'praia',
    tags: ['litoral', 'enseada'],
    coverImageUrl: null,
    source: 'mock',
  },
  {
    id: 'pl-praia-do-rosa',
    slug: 'praia-do-rosa',
    name: 'Praia do Rosa',
    description: 'Enseada em ferradura cercada por morros e lagoa.',
    latitude: -28.13,
    longitude: -48.64,
    municipality: 'Imbituba',
    stateCode: 'SC',
    category: 'praia',
    tags: ['enseada', 'baleias'],
    coverImageUrl: null,
    source: 'mock',
  },
  {
    id: 'pl-lagoa-da-conceicao',
    slug: 'lagoa-da-conceicao',
    name: 'Lagoa da Conceição',
    description: 'Lagoa central da ilha, cercada por dunas e morros.',
    latitude: -27.6,
    longitude: -48.47,
    municipality: 'Florianópolis',
    stateCode: 'SC',
    category: 'cidade',
    tags: ['ilha', 'lagoa'],
    coverImageUrl: null,
    source: 'mock',
  },
  {
    id: 'pl-morro-da-cruz',
    slug: 'morro-da-cruz',
    name: 'Mirante do Morro da Cruz',
    description: 'Vista aberta sobre o centro de Florianópolis e as duas baías.',
    latitude: -27.59,
    longitude: -48.54,
    municipality: 'Florianópolis',
    stateCode: 'SC',
    category: 'mirante',
    tags: ['baías', 'urbano'],
    coverImageUrl: null,
    source: 'mock',
  },
  {
    id: 'pl-serra-dona-francisca',
    slug: 'serra-dona-francisca',
    name: 'Serra Dona Francisca',
    description: 'Estrada de serra em mata atlântica ligando o litoral ao planalto.',
    latitude: -26.19,
    longitude: -49.05,
    municipality: 'Joinville',
    stateCode: 'SC',
    category: 'estrada',
    tags: ['mata atlântica', 'curvas'],
    coverImageUrl: null,
    source: 'mock',
  },
]

/**
 * Estado pessoal do usuário de desenvolvimento.
 *
 * Cobre deliberadamente todas as combinações que a interface precisa exibir:
 * visitado com fotos, visitado favorito, quero conhecer, quero conhecer
 * favorito, e não visitado sem nada. Lugares ausentes desta lista recebem
 * estado neutro no repositório.
 */
export const MOCK_PLACE_USER_STATES: PlaceUserState[] = [
  {
    placeId: 'pl-serra-do-rio-do-rastro',
    isFavorite: true,
    wantsToVisit: false,
    personalNotes: 'Descer no fim da tarde, com a serra limpa.',
    rating: 5,
    lastVisitedAt: '2026-07-26',
    visitCount: 1,
    photoCount: 12,
  },
  {
    placeId: 'pl-guarda-do-embau',
    isFavorite: false,
    wantsToVisit: false,
    personalNotes: null,
    rating: 4,
    lastVisitedAt: '2026-07-19',
    visitCount: 3,
    photoCount: 8,
  },
  {
    placeId: 'pl-santo-amaro-da-imperatriz',
    isFavorite: false,
    wantsToVisit: false,
    personalNotes: null,
    rating: null,
    lastVisitedAt: '2026-05-10',
    visitCount: 1,
    photoCount: 0,
  },
  {
    placeId: 'pl-morro-da-igreja',
    isFavorite: true,
    wantsToVisit: true,
    personalNotes: 'Conferir se a estrada do parque está aberta.',
    rating: null,
    lastVisitedAt: null,
    visitCount: 0,
    photoCount: 0,
  },
  {
    placeId: 'pl-serra-do-corvo-branco',
    isFavorite: false,
    wantsToVisit: true,
    personalNotes: null,
    rating: null,
    lastVisitedAt: null,
    visitCount: 0,
    photoCount: 0,
  },
  {
    placeId: 'pl-praia-do-rosa',
    isFavorite: true,
    wantsToVisit: true,
    personalNotes: null,
    rating: null,
    lastVisitedAt: null,
    visitCount: 0,
    photoCount: 0,
  },
]
```

- [ ] **Passo 4: Criar a interface `src/lib/data/place-repository.ts`**

```ts
import type { ExplorePlace } from '@/domain/place'

/**
 * Contrato de leitura de lugares.
 *
 * A interface fala em `ExplorePlace` — catálogo já combinado com estado pessoal.
 * Combinar é responsabilidade do adapter, porque no Supabase isso será um JOIN e
 * não faz sentido vazar essa forma para a UI.
 */
export interface PlaceRepository {
  listExplorePlaces(): Promise<ExplorePlace[]>
  getBySlug(slug: string): Promise<ExplorePlace | null>
}
```

- [ ] **Passo 5: Escrever o teste do repositório que falha**

`src/lib/data/mock/mock-place-repository.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { mockPlaceRepository } from './mock-place-repository'

describe('mockPlaceRepository', () => {
  it('lista todos os lugares mockados', async () => {
    const places = await mockPlaceRepository.listExplorePlaces()
    expect(places).toHaveLength(14)
  })

  it('combina catálogo com estado pessoal', async () => {
    const places = await mockPlaceRepository.listExplorePlaces()
    const rastro = places.find((p) => p.slug === 'serra-do-rio-do-rastro')

    expect(rastro).toBeDefined()
    expect(rastro!.visitStatus).toBe('visitado')
    expect(rastro!.isFavorite).toBe(true)
    expect(rastro!.photoCount).toBe(12)
  })

  it('dá estado neutro a lugar sem registro pessoal', async () => {
    const places = await mockPlaceRepository.listExplorePlaces()
    const garopaba = places.find((p) => p.slug === 'garopaba')

    expect(garopaba).toBeDefined()
    expect(garopaba!.visitStatus).toBe('nao-visitado')
    expect(garopaba!.isFavorite).toBe(false)
    expect(garopaba!.photoCount).toBe(0)
  })

  it('cobre os três status de visita nos dados de desenvolvimento', async () => {
    const places = await mockPlaceRepository.listExplorePlaces()
    const status = new Set(places.map((p) => p.visitStatus))

    expect(status).toContain('visitado')
    expect(status).toContain('quero-conhecer')
    expect(status).toContain('nao-visitado')
  })

  it('busca por slug', async () => {
    const place = await mockPlaceRepository.getBySlug('urubici')
    expect(place?.name).toBe('Urubici')
  })

  it('devolve null para slug inexistente', async () => {
    expect(await mockPlaceRepository.getBySlug('nao-existe')).toBeNull()
  })
})
```

- [ ] **Passo 6: Rodar e confirmar que falha**

```bash
npm test
```

Esperado: FALHA, módulo `./mock-place-repository` não encontrado.

- [ ] **Passo 7: Implementar `src/lib/data/mock/mock-place-repository.ts`**

```ts
import { toExplorePlace, type ExplorePlace, type PlaceUserState } from '@/domain/place'
import { MOCK_PLACES, MOCK_PLACE_USER_STATES } from '@/mocks/places'
import type { PlaceRepository } from '../place-repository'

/** Estado de quem nunca interagiu com o lugar. */
function neutralState(placeId: string): PlaceUserState {
  return {
    placeId,
    isFavorite: false,
    wantsToVisit: false,
    personalNotes: null,
    rating: null,
    lastVisitedAt: null,
    visitCount: 0,
    photoCount: 0,
  }
}

const stateByPlaceId = new Map(
  MOCK_PLACE_USER_STATES.map((state) => [state.placeId, state]),
)

function buildAll(): ExplorePlace[] {
  return MOCK_PLACES.map((place) =>
    toExplorePlace(place, stateByPlaceId.get(place.id) ?? neutralState(place.id)),
  )
}

export const mockPlaceRepository: PlaceRepository = {
  async listExplorePlaces() {
    return buildAll()
  },

  async getBySlug(slug) {
    return buildAll().find((place) => place.slug === slug) ?? null
  },
}
```

Os métodos são `async` mesmo sem I/O: a assinatura precisa ser idêntica à do
adapter Supabase, senão a troca exigiria mudar quem chama.

- [ ] **Passo 8: Criar o ponto único de troca `src/lib/data/index.ts`**

```ts
import { mockPlaceRepository } from './mock/mock-place-repository'
import type { PlaceRepository } from './place-repository'

/**
 * Adapter ativo. Este é o único arquivo que muda quando o Supabase entrar.
 * Nenhum componente importa um adapter concreto diretamente.
 */
export const placeRepository: PlaceRepository = mockPlaceRepository

export type { PlaceRepository }
```

- [ ] **Passo 9: Rodar e confirmar que passa**

```bash
npm test
```

Esperado: todas as suítes verdes, incluindo as seis novas.

- [ ] **Passo 10: Verificar, atualizar o CHANGELOG e commitar**

```bash
npm run lint && npm run typecheck && npm test
```

CHANGELOG, sob `### Adicionado`:

```markdown
- Interface `PlaceRepository` com adapter em memória, isolando a interface do
  banco de dados
- Coleção de 14 lugares de Santa Catarina como dados de desenvolvimento,
  explicitamente marcados como não verificados
- Moto inicial CFMOTO IBEX 450
```

```bash
git add -A
git commit -m "feat: repositorio de lugares e dados de desenvolvimento"
```

---

## Tarefa 6 — Schema Supabase e documentação do modelo

Nenhuma conexão é feita nesta tarefa. Produzimos a migration versionada, que será
aplicada quando o projeto Supabase existir. É a tarefa que trava as decisões de
dados por escrito.

**Arquivos:**
- Criar: `supabase/migrations/0001_initial_schema.sql`
- Criar: `docs/DATA-MODEL.md`
- Criar: `docs/decisions/0003-estado-pessoal-separado-do-catalogo.md`
- Criar: `docs/decisions/0004-sem-postgis-nesta-fase.md`
- Modificar: `CHANGELOG.md`

**Interfaces:**
- Consome: os tipos de `src/domain/` como referência de nomes e cardinalidade.
- Produz: contrato de banco. As colunas aqui devem casar 1:1 com os campos de
  `Place`, `PlaceUserState`, `Motorcycle`, `Trip`, `TripStop` e `TripPhoto`,
  convertendo `camelCase` para `snake_case`.

- [ ] **Passo 1: Escrever `supabase/migrations/0001_initial_schema.sql`**

```sql
-- Rastro — schema inicial
--
-- Princípio: catálogo de lugares (fato compartilhável) separado de estado
-- pessoal (opinião) e de visitas (evento datado). Ver ADR 0003.
--
-- Toda tabela com dado pessoal carrega user_id e tem RLS ativa desde já, mesmo
-- havendo um único usuário. Adicionar multiusuário depois vira uma questão de
-- autenticação, não de migração de dados.

-- ---------------------------------------------------------------- enums

create type place_category as enum (
  'serra', 'praia', 'mirante', 'natureza', 'cachoeira',
  'estrada', 'cidade', 'cafe', 'restaurante', 'ponto_turistico'
);

create type place_source as enum ('mock', 'manual', 'imported');

create type trip_status as enum ('planned', 'ongoing', 'completed');

create type trip_stop_kind as enum (
  'start', 'waypoint', 'destination', 'fuel', 'meal'
);

-- ---------------------------------------------------------------- profiles

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  home_label text,
  home_latitude double precision,
  home_longitude double precision,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- motorcycles

create table motorcycles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  make text not null,
  model text not null,
  year smallint,
  nickname text,
  odometer_km integer,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index motorcycles_user_id_idx on motorcycles (user_id);

-- Uma única moto padrão por usuário. Índice parcial em vez de trigger.
create unique index motorcycles_one_default_per_user
  on motorcycles (user_id) where is_default;

-- ---------------------------------------------------------------- places

-- Catálogo. Fato objetivo, compartilhável.
--
-- Não há coluna de distância nem de tempo estimado: ambos dependem da origem de
-- quem consulta e são calculados em tempo de leitura.
create table places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  latitude double precision not null,
  longitude double precision not null,
  municipality text,
  state_code text not null default 'SC',
  country_code text not null default 'BR',
  category place_category not null,
  tags text[] not null default '{}',
  cover_image_url text,
  source place_source not null default 'manual',
  -- NULL indica lugar curado, pertencente ao catálogo global.
  created_by uuid references auth.users on delete set null,
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint places_latitude_range check (latitude between -90 and 90),
  constraint places_longitude_range check (longitude between -180 and 180)
);

create index places_category_idx on places (category);
create index places_created_by_idx on places (created_by);
-- Índice de apoio para recortes por caixa envolvente antes do haversine.
create index places_lat_lng_idx on places (latitude, longitude);

-- ---------------------------------------------------------------- visits

-- Evento. A verdade sobre "já estive lá" vive aqui, não num booleano.
create table place_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  place_id uuid not null references places on delete cascade,
  trip_id uuid,
  visited_at date not null,
  -- Como foi ESTA visita, distinto da opinião geral sobre o lugar.
  rating smallint check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create index place_visits_user_place_idx on place_visits (user_id, place_id);
create index place_visits_visited_at_idx on place_visits (user_id, visited_at desc);

-- ---------------------------------------------------------------- user state

-- Vínculo usuário ↔ lugar. Substitui a tabela `favorites` do rascunho: favorito
-- é atributo deste vínculo, não entidade. Ver ADR 0003.
create table place_user_states (
  user_id uuid not null references auth.users on delete cascade,
  place_id uuid not null references places on delete cascade,
  is_favorite boolean not null default false,
  wants_to_visit boolean not null default false,
  personal_notes text,
  -- Opinião geral e atual sobre o lugar.
  rating smallint check (rating between 1 and 5),
  -- Colunas derivadas de place_visits, mantidas pelo trigger abaixo.
  first_visited_at date,
  last_visited_at date,
  visit_count integer not null default 0,
  photo_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

create index place_user_states_favorites_idx
  on place_user_states (user_id) where is_favorite;

-- ---------------------------------------------------------------- trips

create table trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  motorcycle_id uuid references motorcycles on delete set null,
  title text not null,
  slug text not null,
  status trip_status not null default 'planned',
  started_at timestamptz,
  ended_at timestamptz,
  origin_label text,
  origin_latitude double precision,
  origin_longitude double precision,
  primary_place_id uuid references places on delete set null,
  distance_km numeric(8, 2),
  duration_minutes integer,
  -- Avaliação da viagem como um todo.
  rating smallint check (rating between 1 and 5),
  notes text,
  -- Traçado como GeoJSON. Sem tipo geométrico dedicado. Ver ADR 0004.
  route_geojson jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index trips_user_started_idx on trips (user_id, started_at desc);
create index trips_status_idx on trips (user_id, status);

alter table place_visits
  add constraint place_visits_trip_id_fkey
  foreign key (trip_id) references trips on delete set null;

-- ---------------------------------------------------------------- trip stops

create table trip_stops (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  place_id uuid references places on delete set null,
  order_index smallint not null,
  label text not null,
  latitude double precision,
  longitude double precision,
  kind trip_stop_kind not null default 'waypoint',
  arrived_at timestamptz,
  notes text,
  unique (trip_id, order_index)
);

create index trip_stops_trip_idx on trip_stops (trip_id, order_index);

-- ---------------------------------------------------------------- trip photos

-- latitude, longitude e taken_at existem desde já para receber EXIF. Nenhuma
-- leitura de EXIF é implementada nesta fase.
create table trip_photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  place_id uuid references places on delete set null,
  storage_path text not null,
  width integer,
  height integer,
  latitude double precision,
  longitude double precision,
  taken_at timestamptz,
  caption text,
  exif jsonb,
  sort_index smallint not null default 0,
  created_at timestamptz not null default now()
);

create index trip_photos_trip_idx on trip_photos (trip_id, sort_index);
create index trip_photos_place_idx on trip_photos (place_id);
-- Suporta posicionar fotos no mapa quando houver coordenada.
create index trip_photos_located_idx
  on trip_photos (user_id) where latitude is not null;

-- ------------------------------------------------- derivação de visitas

-- Mantém place_user_states em dia a partir de place_visits. As colunas
-- derivadas existem por desempenho de leitura do mapa; a verdade continua
-- sendo a tabela de eventos.
create or replace function refresh_place_user_state()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_user uuid := coalesce(new.user_id, old.user_id);
  target_place uuid := coalesce(new.place_id, old.place_id);
begin
  insert into place_user_states (user_id, place_id)
  values (target_user, target_place)
  on conflict (user_id, place_id) do nothing;

  update place_user_states s
  set
    visit_count = agg.total,
    first_visited_at = agg.first_at,
    last_visited_at = agg.last_at,
    updated_at = now()
  from (
    select
      count(*) as total,
      min(visited_at) as first_at,
      max(visited_at) as last_at
    from place_visits
    where user_id = target_user and place_id = target_place
  ) agg
  where s.user_id = target_user and s.place_id = target_place;

  return null;
end;
$$;

create trigger place_visits_refresh_state
after insert or update or delete on place_visits
for each row execute function refresh_place_user_state();

-- ---------------------------------------------------------------- RLS

alter table profiles           enable row level security;
alter table motorcycles        enable row level security;
alter table places             enable row level security;
alter table place_visits       enable row level security;
alter table place_user_states  enable row level security;
alter table trips              enable row level security;
alter table trip_stops         enable row level security;
alter table trip_photos        enable row level security;

create policy profiles_own on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy motorcycles_own on motorcycles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy place_visits_own on place_visits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy place_user_states_own on place_user_states
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy trips_own on trips
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy trip_photos_own on trip_photos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- trip_stops não tem user_id próprio: a posse é herdada da viagem.
create policy trip_stops_via_trip on trip_stops
  for all
  using (exists (
    select 1 from trips t where t.id = trip_stops.trip_id and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from trips t where t.id = trip_stops.trip_id and t.user_id = auth.uid()
  ));

-- Catálogo: leitura do que é público ou próprio; escrita apenas do próprio.
create policy places_read on places
  for select using (is_public or created_by = auth.uid());

create policy places_insert on places
  for insert with check (created_by = auth.uid());

create policy places_update on places
  for update using (created_by = auth.uid()) with check (created_by = auth.uid());

create policy places_delete on places
  for delete using (created_by = auth.uid());
```

- [ ] **Passo 2: Validar a sintaxe do SQL**

Se o Supabase CLI estiver disponível, aplique num banco local:

```bash
npx supabase start && npx supabase db reset
```

Se não estiver, revise manualmente esta lista antes de seguir:

- Cada `references` aponta para uma tabela já criada acima dele. A única exceção
  é `place_visits.trip_id`, resolvida depois por `alter table` — porque `trips`
  nasce após `place_visits`.
- Todo `create policy` cita uma tabela que teve `enable row level security`.
- Nenhuma tabela com `user_id` ficou sem policy.
- O corpo da função usa `$$` e não conflita com aspas internas.

- [ ] **Passo 3: Escrever `docs/decisions/0003-estado-pessoal-separado-do-catalogo.md`**

Conteúdo: **Contexto** — o rascunho inicial tratava `Place` como entidade única
contendo fato objetivo e opinião pessoal, e propunha uma entidade `Favorite`
separada. **Decisão** — três conceitos separados (`places`, `place_user_states`,
`place_visits`), e nenhuma tabela `Favorite`, porque favorito é atributo do
vínculo usuário↔lugar e uma tabela dedicada de duas colunas só adicionaria um
JOIN no caminho mais quente da aplicação, que é o desenho do mapa.
**Consequências** — "visitado" deixa de ser booleano e passa a ser *existe ao
menos uma visita*; é possível visitar o mesmo lugar várias vezes com data e nota
próprias; `visit_count`, `first_visited_at` e `last_visited_at` são cache
derivado mantido por trigger, e a verdade permanece na tabela de eventos; o custo
é um trigger a manter e a disciplina de nunca escrever nas colunas derivadas
diretamente.

- [ ] **Passo 4: Escrever `docs/decisions/0004-sem-postgis-nesta-fase.md`**

Conteúdo: **Contexto** — consultas por raio ("lugares até 150 km de Palhoça") são
centrais no produto, e o Postgres oferece PostGIS com `geography(Point)`,
`ST_DWithin` e índice GiST. **Decisão** — manter `latitude` e `longitude` como
`double precision` e calcular haversine em código puro
(`src/domain/geo.ts`). **Motivos** — com centenas de lugares o ganho de
desempenho é irrelevante; PostGIS quebraria a paridade entre o repositório mock e
o adapter Supabase, já que a filtragem em memória teria de replicar semântica de
tipo geométrico; e manter o cálculo no domínio o torna testável sem banco.
**Gatilho de revisão** — quando o catálogo passar de alguns milhares de lugares,
ou quando surgir necessidade de consulta por polígono (regiões de SC exploradas),
migrar para PostGIS adicionando uma coluna `geography` gerada a partir das
existentes, sem perda de dados. **Nota** — `route_geojson jsonb` segue a mesma
lógica: guardamos o traçado como GeoJSON e não como geometria.

- [ ] **Passo 5: Escrever `docs/DATA-MODEL.md`**

Deve conter: diagrama textual das relações entre as oito tabelas com
cardinalidade; uma seção por tabela explicando o propósito e as colunas não
óbvias; a tabela dos três campos `rating` e o que cada um mede
(`place_visits.rating` = aquela visita; `place_user_states.rating` = opinião
geral atual; `trips.rating` = a viagem inteira); a explicação das colunas
derivadas e do trigger; o mapeamento `camelCase` do domínio →  `snake_case` do
banco; a estratégia de RLS; e a seção **Perguntas que o schema já responde**
listando as estatísticas futuras do produto com a consulta correspondente em
linguagem natural — km viajados e maior viagem por agregação sobre `trips`;
lugares e municípios visitados por `place_visits` ⋈ `places.municipality`; mês
com mais viagens por `date_trunc` sobre `trips.started_at`; km por moto agrupando
`trips` por `motorcycle_id`; e a timeline de Memórias por `trips` com
`status = 'completed'` ordenado por `started_at desc`.

- [ ] **Passo 6: Atualizar o CHANGELOG e commitar**

Não há código a lintar nesta tarefa, mas rode a suíte para garantir que nada
regrediu:

```bash
npm run lint && npm run typecheck && npm test
```

CHANGELOG, sob `### Adicionado`:

```markdown
- Migration inicial do Supabase com oito tabelas, enums, índices, trigger de
  derivação de visitas e políticas de RLS por usuário
- ADR 0003 registrando a separação entre catálogo, estado pessoal e visitas, e a
  remoção da entidade `Favorite`
- ADR 0004 registrando a decisão de não adotar PostGIS nesta fase
- Documentação do modelo de dados em `docs/DATA-MODEL.md`
```

```bash
git add -A
git commit -m "feat: schema inicial do supabase com rls e trigger de visitas"
```

---

## Tarefa 7 — Shell de layout, navegação e rotas

Esta tarefa cria a casca em que o mapa vai morar. O mapa ainda não existe; no
lugar dele fica uma área vazia com o fundo `--color-void`, substituída na
Tarefa 8. Isso permite validar a estrutura do shell isoladamente.

**Arquivos:**
- Criar: `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`,
  `src/app/(app)/descobrir/page.tsx`, `src/app/(app)/viagens/page.tsx`,
  `src/app/(app)/memorias/page.tsx`
- Criar: `src/components/layout/TopBar.tsx`,
  `src/components/layout/StatusBar.tsx`,
  `src/components/layout/OverlayPanel.tsx`
- Remover: `src/app/page.tsx`
- Modificar: `CHANGELOG.md`

**Interfaces:**
- Consome: `Button` de `@/components/ui/Button`; `DEFAULT_ORIGIN_LABEL` de
  `@/mocks/user`; `cn` de `@/lib/utils/cn`.
- Produz:
  - `<TopBar />` — sem props, lê a rota ativa por `usePathname`
  - `<StatusBar />` — sem props nesta tarefa
  - `<OverlayPanel side="left" | "right">` — invólucro posicionado sobre o mapa,
    consumido pelas Tarefas 10, 11 e 12

### Por que overlay e não coluna

O shell tem três faixas fixas: topbar, corpo e statusbar. O corpo é um contêiner
`relative` de altura total, com o mapa em `absolute inset-0` e o `children` da
rota por cima, também em `absolute inset-0`, com `pointer-events-none`. Cada
painel dentro do overlay reativa `pointer-events-auto`.

Consequência: o mapa ocupa a largura inteira **por baixo** dos painéis, em vez de
ser espremido entre colunas. É isso que faz o mapa ser estrutura e não widget.

- [ ] **Passo 1: Remover a home provisória**

```bash
git rm src/app/page.tsx
```

A rota `/` passa a ser servida por `src/app/(app)/page.tsx`. Route groups entre
parênteses não aparecem na URL.

- [ ] **Passo 2: Criar `src/components/layout/TopBar.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

const NAV_ITEMS = [
  { href: '/', label: 'Explorar' },
  { href: '/descobrir', label: 'Descobrir' },
  { href: '/viagens', label: 'Viagens' },
  { href: '/memorias', label: 'Memórias' },
] as const

function isActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname.startsWith(href)
}

export function TopBar() {
  const pathname = usePathname()

  return (
    <header
      className="relative z-20 flex h-12 shrink-0 items-center gap-8
                 border-b border-line bg-base/85 px-4 backdrop-blur-sm"
    >
      <Link
        href="/"
        className="flex items-center gap-2 text-sm font-semibold
                   tracking-[0.18em] text-ink uppercase"
      >
        <span aria-hidden className="h-3.5 w-0.5 bg-accent" />
        Rastro
      </Link>

      <nav aria-label="Navegação principal">
        <ul className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'block px-3 py-1.5 text-[11px] uppercase tracking-[0.12em]',
                    'transition-colors',
                    active
                      ? 'text-accent'
                      : 'text-ink-faint hover:text-ink-muted',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
```

O `backdrop-blur-sm` está aqui por legibilidade sobre o mapa, não por estética —
é a única exceção permitida à regra anti-glassmorphism.

- [ ] **Passo 3: Criar `src/components/layout/StatusBar.tsx`**

Nesta tarefa a barra mostra apenas a origem e um placeholder de coordenadas. A
Tarefa 8 liga as coordenadas e o zoom reais do mapa; a Tarefa 11 acrescenta a
contagem de lugares filtrados. Não inventamos a plumbing antes de existir dado.

```tsx
import { DEFAULT_ORIGIN_LABEL } from '@/mocks/user'

export function StatusBar() {
  return (
    <footer
      className="relative z-20 flex h-7 shrink-0 items-center gap-6
                 border-t border-line bg-base px-4"
    >
      <span className="instrument-value text-[10px] text-ink-faint">
        ⌖ —.———— —.————
      </span>
      <span className="instrument-value text-[10px] text-ink-faint">Z—</span>
      <span className="ml-auto instrument-value text-[10px] text-ink-faint">
        ⌂ {DEFAULT_ORIGIN_LABEL}
      </span>
    </footer>
  )
}
```

- [ ] **Passo 4: Criar `src/components/layout/OverlayPanel.tsx`**

Invólucro reutilizável para tudo que flutua sobre o mapa. Painel do lugar,
trilha de filtros e formulário de descoberta usam este mesmo componente, o que
garante que a moldura seja idêntica nos três.

```tsx
import { cn } from '@/lib/utils/cn'

interface OverlayPanelProps {
  side: 'left' | 'right'
  /** Largura em pixels. Padrão: 380 à direita, 232 à esquerda. */
  width?: number
  className?: string
  children: React.ReactNode
}

const SIDE_CLASS = {
  left: 'left-0 border-r',
  right: 'right-0 border-l',
} as const

export function OverlayPanel({
  side,
  width,
  className,
  children,
}: OverlayPanelProps) {
  return (
    <aside
      style={{ width: width ?? (side === 'right' ? 380 : 232) }}
      className={cn(
        'pointer-events-auto absolute top-0 bottom-0 flex flex-col',
        'border-line bg-base/95 backdrop-blur-sm',
        SIDE_CLASS[side],
        className,
      )}
    >
      {children}
    </aside>
  )
}
```

Sem sombra e sem raio: a separação vem do `border-line` de 1px, coerente com a
regra de hairlines.

- [ ] **Passo 5: Criar `src/app/(app)/layout.tsx`**

```tsx
import { StatusBar } from '@/components/layout/StatusBar'
import { TopBar } from '@/components/layout/TopBar'

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-void">
      <TopBar />

      <div className="relative flex-1">
        {/* Substituído pelo <MapCanvas /> na Tarefa 8. */}
        <div className="absolute inset-0 bg-void" />

        {/* Overlay das rotas. Não intercepta o mapa; cada painel reativa
            pointer-events por conta própria. */}
        <div className="pointer-events-none absolute inset-0">{children}</div>
      </div>

      <StatusBar />
    </div>
  )
}
```

- [ ] **Passo 6: Criar `src/app/(app)/page.tsx` (Explore)**

Placeholder estrutural. As Tarefas 9 a 11 preenchem este arquivo.

```tsx
export default function ExplorePage() {
  return null
}
```

- [ ] **Passo 7: Criar as três rotas restantes**

`src/app/(app)/descobrir/page.tsx` — a Tarefa 12 substitui:

```tsx
export default function DescobrirPage() {
  return null
}
```

`src/app/(app)/viagens/page.tsx`:

```tsx
import { OverlayPanel } from '@/components/layout/OverlayPanel'

export default function ViagensPage() {
  return (
    <OverlayPanel side="right">
      <div className="flex flex-1 flex-col justify-center gap-3 px-5">
        <span className="instrument-label">Viagens</span>
        <p className="text-sm leading-relaxed text-ink-muted">
          Ainda não há viagens registradas. O registro de viagens entra numa
          próxima etapa.
        </p>
      </div>
    </OverlayPanel>
  )
}
```

`src/app/(app)/memorias/page.tsx`:

```tsx
import { OverlayPanel } from '@/components/layout/OverlayPanel'

export default function MemoriasPage() {
  return (
    <OverlayPanel side="right">
      <div className="flex flex-1 flex-col justify-center gap-3 px-5">
        <span className="instrument-label">Memórias</span>
        <p className="text-sm leading-relaxed text-ink-muted">
          As memórias aparecem aqui quando houver viagens concluídas, organizadas
          por ano e mês.
        </p>
      </div>
    </OverlayPanel>
  )
}
```

Os stubs dizem o que virá, com data indefinida e sem prometer prazo. Nunca uma
tela em branco sem explicação.

- [ ] **Passo 8: Verificar no navegador**

```bash
npm run dev
```

Confirme em `http://localhost:3000`:

- A topbar tem 48px, marca à esquerda com o traço âmbar, quatro itens de
  navegação.
- Clicar em Viagens e Memórias abre o painel à direita; o item ativo fica âmbar.
- A statusbar fica colada embaixo e o corpo ocupa exatamente o resto — a página
  **não** rola.
- Navegando por Tab, todos os links recebem o anel de foco âmbar.
- Em `/`, a área central fica vazia e escura, sem erro no console.

- [ ] **Passo 9: Verificar, atualizar o CHANGELOG e commitar**

```bash
npm run lint && npm run typecheck && npm test
```

CHANGELOG, sob `### Adicionado`:

```markdown
- Shell da aplicação com barra superior, corpo de altura total e barra de status
- Navegação principal entre Explorar, Descobrir, Viagens e Memórias
- Painel de overlay reutilizável, posicionado sobre a área do mapa
- Rotas de Viagens e Memórias como stubs explicativos
```

```bash
git add -A
git commit -m "feat: shell de layout e navegacao principal"
```

---

## Tarefa 8 — Mapa: estilo autoral, canvas e fallback

A tarefa mais densa do plano. Produz a instância persistente do MapLibre, o
`style.json` escrito por nós e o estado explícito de ausência de chave.

**Arquivos:**
- Criar: `src/lib/map/config.ts`, `src/lib/map/style.ts`
- Criar: `src/components/map/map-context.tsx`,
  `src/components/map/MapCanvas.tsx`, `src/components/map/MapFallback.tsx`
- Modificar: `src/app/(app)/layout.tsx`,
  `src/components/layout/StatusBar.tsx`
- Criar: `docs/decisions/0002-mapa-persistente-no-layout.md`
- Criar: `docs/MAP-STRATEGY.md`
- Modificar: `CHANGELOG.md`

**Interfaces:**
- Consome: `Coordinates` de `@/domain/geo`; `DEFAULT_ORIGIN_LABEL` de
  `@/mocks/user`.
- Produz:
  - `MAPTILER_KEY`, `hasMapTilerKey`, `INITIAL_CENTER`, `INITIAL_ZOOM`
  - `buildRastroStyle(key: string): StyleSpecification`
  - `<MapProvider>`, `useMapInstance(): MapLibreMap | null`,
    `useMapView(): MapView | null`
  - `<MapCanvas />`
  - As Tarefas 9, 11 e 12 dependem de `useMapInstance()`.

### Nota sobre a tipografia do mapa

Os labels do mapa **não** usam Geist Mono. O MapTiler serve glyphs apenas de
famílias como Noto Sans; usar Geist Mono exigiria gerar e hospedar um conjunto de
`.pbf` próprio. Usamos Noto Sans com caixa alta, tracking largo e halo — o
caráter cartográfico vem do tratamento, não da família. Geist Mono segue
exclusivo do chrome HTML. Registre isto em `docs/MAP-STRATEGY.md`.

- [ ] **Passo 1: Criar `src/lib/map/config.ts`**

```ts
import type { Coordinates } from '@/domain/geo'

/**
 * Chave do MapTiler. Inlinada no bundle do cliente pelo prefixo NEXT_PUBLIC_,
 * o que é esperado: chaves de tiles são públicas por natureza e devem ser
 * restringidas por domínio no painel do MapTiler, não escondidas.
 */
export const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? ''

export const hasMapTilerKey = MAPTILER_KEY.length > 0

/** Enquadramento inicial: Grande Florianópolis com a serra ao alcance. */
export const INITIAL_CENTER: Coordinates = {
  latitude: -27.85,
  longitude: -48.95,
}

export const INITIAL_ZOOM = 8.2

/** Não definimos maxBounds: viagens longas podem sair de Santa Catarina. */
```

- [ ] **Passo 2: Criar `src/lib/map/style.ts`**

```ts
import type { StyleSpecification } from 'maplibre-gl'

/**
 * Estilo autoral do Rastro sobre os vector tiles do MapTiler (schema
 * OpenMapTiles).
 *
 * Três princípios:
 *
 * 1. A estrada é o conteúdo. Num app de moto a malha viária recebe o maior
 *    contraste do mapa, acima de qualquer outro elemento de base.
 * 2. O fundo cede o palco. Água quase preta, vegetação apenas insinuada — o que
 *    precisa ser lido são os pins e as estradas.
 * 3. Relevo importa. O hillshade a partir do terrain-RGB é o que faz as serras
 *    catarinenses existirem visualmente em vez de virarem mancha plana.
 *
 * Nenhuma cor aqui usa o âmbar do produto: o âmbar é reservado aos pins e à
 * interface, para que sempre se destaque contra a base.
 */
export function buildRastroStyle(key: string): StyleSpecification {
  const tiles = `https://api.maptiler.com/tiles/v3/tiles.json?key=${key}`
  const terrain = `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${key}`

  return {
    version: 8,
    glyphs: `https://api.maptiler.com/fonts/{fontstack}/{range}.pbf?key=${key}`,
    sources: {
      basemap: { type: 'vector', url: tiles },
      terrain: { type: 'raster-dem', url: terrain, tileSize: 256 },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': '#0a0c0b' },
      },
      {
        id: 'landcover-wood',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'landcover',
        filter: ['==', ['get', 'class'], 'wood'],
        paint: { 'fill-color': '#0e1512', 'fill-opacity': 0.75 },
      },
      {
        id: 'park',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'park',
        paint: { 'fill-color': '#0f1714', 'fill-opacity': 0.6 },
      },
      {
        id: 'water',
        type: 'fill',
        source: 'basemap',
        'source-layer': 'water',
        paint: { 'fill-color': '#060b0e' },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'basemap',
        'source-layer': 'waterway',
        paint: {
          'line-color': '#0d1519',
          'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.4, 14, 1.6],
        },
      },
      {
        // Relevo. Fica acima da base e abaixo das estradas, de modo que a
        // sombra dê volume ao terreno sem sujar a malha viária.
        id: 'hillshade',
        type: 'hillshade',
        source: 'terrain',
        paint: {
          'hillshade-exaggeration': 0.38,
          'hillshade-shadow-color': '#000000',
          'hillshade-highlight-color': '#3d4d46',
          'hillshade-accent-color': '#121a17',
        },
      },
      {
        id: 'road-minor',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        minzoom: 10,
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#3f3d38',
          'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.4, 16, 3],
        },
      },
      {
        id: 'road-tertiary',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['tertiary', 'secondary']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#6a655c',
          'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.5, 16, 5],
        },
      },
      {
        id: 'road-primary',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['primary', 'trunk']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#948b7c',
          'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 16, 7],
        },
      },
      {
        id: 'road-motorway',
        type: 'line',
        source: 'basemap',
        'source-layer': 'transportation',
        filter: ['==', ['get', 'class'], 'motorway'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#bcb09a',
          'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.8, 16, 9],
        },
      },
      {
        id: 'boundary-admin',
        type: 'line',
        source: 'basemap',
        'source-layer': 'boundary',
        filter: ['<=', ['get', 'admin_level'], 4],
        paint: {
          'line-color': '#2b322f',
          'line-width': 0.7,
          'line-dasharray': [3, 2],
        },
      },
      {
        id: 'road-label',
        type: 'symbol',
        source: 'basemap',
        'source-layer': 'transportation_name',
        minzoom: 11,
        layout: {
          'symbol-placement': 'line',
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-size': 10,
          'text-letter-spacing': 0.08,
        },
        paint: {
          'text-color': '#9aa5a0',
          'text-halo-color': '#0a0c0b',
          'text-halo-width': 1.2,
        },
      },
      {
        // Caixa alta e tracking largo: é daqui que vem a leitura cartográfica,
        // já que a família não pode ser Geist Mono.
        id: 'place-label',
        type: 'symbol',
        source: 'basemap',
        'source-layer': 'place',
        filter: [
          'in',
          ['get', 'class'],
          ['literal', ['city', 'town', 'village']],
        ],
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Regular'],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.16,
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6,
            9,
            12,
            12,
          ],
          'text-max-width': 8,
        },
        paint: {
          'text-color': '#c3ccc8',
          'text-halo-color': '#0a0c0b',
          'text-halo-width': 1.4,
        },
      },
    ],
  }
}
```

- [ ] **Passo 3: Criar `src/components/map/map-context.tsx`**

```tsx
'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { Coordinates } from '@/domain/geo'

export interface MapView {
  center: Coordinates
  zoom: number
}

interface MapContextValue {
  map: MapLibreMap | null
  view: MapView | null
  registerMap: (map: MapLibreMap | null) => void
  updateView: (view: MapView) => void
}

const MapContext = createContext<MapContextValue | null>(null)

export function MapProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [view, setView] = useState<MapView | null>(null)

  const value = useMemo<MapContextValue>(
    () => ({ map, view, registerMap: setMap, updateView: setView }),
    [map, view],
  )

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>
}

function useMapContext(): MapContextValue {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMapContext precisa estar dentro de <MapProvider>')
  }
  return context
}

/** Instância do MapLibre. `null` até o mapa terminar de carregar. */
export function useMapInstance(): MapLibreMap | null {
  return useMapContext().map
}

/** Centro e zoom atuais. `null` antes do primeiro movimento. */
export function useMapView(): MapView | null {
  return useMapContext().view
}

/** Uso exclusivo do MapCanvas. */
export function useMapRegistry() {
  const { registerMap, updateView } = useMapContext()
  return { registerMap, updateView }
}
```

- [ ] **Passo 4: Criar `src/components/map/MapFallback.tsx`**

```tsx
export function MapFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-void">
      <div className="max-w-sm border border-line px-6 py-5">
        <span className="instrument-label">Mapa indisponível</span>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          A chave do MapTiler não foi configurada. Defina{' '}
          <code className="instrument-value text-ink">
            NEXT_PUBLIC_MAPTILER_KEY
          </code>{' '}
          em <code className="instrument-value text-ink">.env.local</code> e
          reinicie o servidor.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-ink-faint">
          A chave gratuita fica em cloud.maptiler.com, em Account → Keys.
        </p>
      </div>
    </div>
  )
}
```

Estado explícito e acionável, com o nome exato da variável e onde obtê-la. Nunca
um mapa cinza sem explicação.

- [ ] **Passo 5: Criar `src/components/map/MapCanvas.tsx`**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  INITIAL_CENTER,
  INITIAL_ZOOM,
  MAPTILER_KEY,
  hasMapTilerKey,
} from '@/lib/map/config'
import { buildRastroStyle } from '@/lib/map/style'
import { MapFallback } from './MapFallback'
import { useMapRegistry } from './map-context'

export function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { registerMap, updateView } = useMapRegistry()

  useEffect(() => {
    if (!hasMapTilerKey) return
    const container = containerRef.current
    if (!container) return

    const map = new maplibregl.Map({
      container,
      style: buildRastroStyle(MAPTILER_KEY),
      center: [INITIAL_CENTER.longitude, INITIAL_CENTER.latitude],
      zoom: INITIAL_ZOOM,
      attributionControl: { compact: true },
      // Sem rotação: o norte fixo é convenção cartográfica e evita
      // desorientação em uso rápido, que é o caso durante uma viagem.
      dragRotate: false,
      pitchWithRotate: false,
    })

    map.touchZoomRotate.disableRotation()

    function publishView() {
      const center = map.getCenter()
      updateView({
        center: { latitude: center.lat, longitude: center.lng },
        zoom: map.getZoom(),
      })
    }

    map.on('load', () => {
      publishView()
      registerMap(map)
    })
    map.on('move', publishView)

    return () => {
      registerMap(null)
      map.remove()
    }
  }, [registerMap, updateView])

  if (!hasMapTilerKey) {
    return <MapFallback />
  }

  return <div ref={containerRef} className="absolute inset-0" />
}
```

`registerMap` só é chamado no evento `load` — antes disso o estilo ainda não tem
camadas, e a Tarefa 9 precisa de um mapa pronto para receber fontes.

- [ ] **Passo 6: Ligar o mapa ao layout**

Em `src/app/(app)/layout.tsx`, substitua o `div` placeholder e envolva tudo no
provider:

```tsx
import { StatusBar } from '@/components/layout/StatusBar'
import { TopBar } from '@/components/layout/TopBar'
import { MapCanvas } from '@/components/map/MapCanvas'
import { MapProvider } from '@/components/map/map-context'

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <MapProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-void">
        <TopBar />

        <div className="relative flex-1">
          <MapCanvas />
          <div className="pointer-events-none absolute inset-0">{children}</div>
        </div>

        <StatusBar />
      </div>
    </MapProvider>
  )
}
```

O `<MapCanvas />` está no layout, não na página: navegar entre as quatro rotas
**não** desmonta o componente e portanto não recria a instância do MapLibre.
É a decisão central do ADR 0002.

- [ ] **Passo 7: Ligar as coordenadas reais à statusbar**

Substitua `src/components/layout/StatusBar.tsx`:

```tsx
'use client'

import { formatCoordinate } from '@/domain/geo'
import { useMapView } from '@/components/map/map-context'
import { DEFAULT_ORIGIN_LABEL } from '@/mocks/user'

export function StatusBar() {
  const view = useMapView()

  return (
    <footer
      className="relative z-20 flex h-7 shrink-0 items-center gap-6
                 border-t border-line bg-base px-4"
    >
      <span className="instrument-value text-[10px] text-ink-faint">
        {'⌖ '}
        {view
          ? `${formatCoordinate(view.center.latitude)} ${formatCoordinate(view.center.longitude)}`
          : '—.———— —.————'}
      </span>
      <span className="instrument-value text-[10px] text-ink-faint">
        Z{view ? view.zoom.toFixed(1) : '—'}
      </span>
      <span className="ml-auto instrument-value text-[10px] text-ink-faint">
        ⌂ {DEFAULT_ORIGIN_LABEL}
      </span>
    </footer>
  )
}
```

- [ ] **Passo 8: Verificar no navegador**

Preencha `NEXT_PUBLIC_MAPTILER_KEY` em `.env.local` e rode:

```bash
npm run dev
```

Confirme:

- O mapa cobre toda a área entre topbar e statusbar, sem moldura e sem card.
- As serras aparecem com relevo — o hillshade está funcionando.
- As rodovias são o elemento de maior contraste da base.
- Nomes de cidades em caixa alta com espaçamento largo.
- Arrastar o mapa atualiza coordenadas e zoom na statusbar em tempo real.
- Arrastar com o botão direito **não** rotaciona.
- Navegar para `/viagens` e voltar para `/` **não** recarrega o mapa: a posição e
  o zoom permanecem exatamente onde estavam. Esta é a verificação mais
  importante da tarefa.

Depois, teste o fallback: comente a variável em `.env.local`, reinicie o
servidor, confirme o aviso legível e volte a habilitá-la.

- [ ] **Passo 9: Escrever `docs/decisions/0002-mapa-persistente-no-layout.md`**

Conteúdo: **Contexto** — o Rastro tem quatro áreas que compartilham o mesmo mapa;
montar o mapa dentro de cada página faria o MapLibre ser destruído e recriado a
cada navegação, com recarga de tiles, perda de posição e um piscar de tela.
**Decisão** — `<MapCanvas />` vive em `src/app/(app)/layout.tsx`; as páginas
renderizam apenas overlays sobre ele, dentro de um contêiner com
`pointer-events-none`. **Consequências** — a instância sobrevive à navegação e o
estado de câmera é contínuo; em troca, o acesso ao mapa passa por contexto
(`useMapInstance`) em vez de props, e páginas que registram camadas precisam
tratar o caso de o mapa ainda ser `null` durante o carregamento. **Alternativa
recusada** — manter o mapa em cada página e sincronizar a câmera via URL: reduz o
acoplamento por contexto, mas mantém o custo de recriação e o piscar.

- [ ] **Passo 10: Escrever `docs/MAP-STRATEGY.md`**

Deve conter: por que `maplibre-gl` puro e não `react-map-gl` (remetendo ao ADR
0001); a estrutura de `buildRastroStyle` com a lista de camadas em ordem e a
razão de cada faixa de cor; os três princípios do estilo (estrada é conteúdo,
fundo cede o palco, relevo importa); a nota sobre tipografia do mapa não poder
ser Geist Mono e a razão; a decisão de desabilitar rotação; a política da chave
do MapTiler ser pública e restringida por domínio no painel, não escondida; e um
espaço reservado para a seção de camadas de pins, preenchida na Tarefa 9.

- [ ] **Passo 11: Verificar, atualizar o CHANGELOG e commitar**

```bash
npm run lint && npm run typecheck && npm test
```

CHANGELOG, sob `### Adicionado`:

```markdown
- Mapa MapLibre em tela cheia com estilo escuro autoral sobre tiles do MapTiler,
  com relevo sombreado das serras e ênfase na malha viária
- Instância de mapa persistente no layout, preservando posição e zoom ao navegar
  entre as áreas do aplicativo
- Estado de fallback explícito quando a chave do MapTiler não está configurada
- Coordenadas e zoom ao vivo na barra de status
- ADR 0002 registrando o mapa persistente no layout
- Documentação da estratégia de mapa em `docs/MAP-STRATEGY.md`
```

```bash
git add -A
git commit -m "feat: mapa maplibre com estilo autoral e instancia persistente"
```

---

## Tarefa 9 — Pins: camadas data-driven e seleção

**Arquivos:**
- Criar: `src/lib/map/layers.ts`, `src/lib/map/layers.test.ts`
- Criar: `src/components/map/PlacesLayer.tsx`,
  `src/components/explore/use-selected-place.ts`
- Modificar: `src/app/(app)/page.tsx`, `docs/MAP-STRATEGY.md`
- Criar: `docs/decisions/0005-pins-como-camadas-data-driven.md`
- Modificar: `CHANGELOG.md`

**Interfaces:**
- Consome: `ExplorePlace` de `@/domain/place`; `useMapInstance` de
  `@/components/map/map-context`; `placeRepository` de `@/lib/data`.
- Produz:
  - `PLACE_LAYERS = { favoriteRing, core, photoDot, selected, label }` (ids)
  - `PLACES_SOURCE_ID`
  - `buildPlacesGeoJson(places: readonly ExplorePlace[]): FeatureCollection`
  - `<PlacesLayer places={ExplorePlace[]} />`
  - `useSelectedPlace(): { slug: string | null; select: (slug: string | null) => void }`

### Os três canais visuais

| Canal | Camada | Codifica |
|---|---|---|
| Cor do miolo e do contorno | `places-core` | Status de visita |
| Anel externo | `places-favorite-ring` | Favorito |
| Ponto satélite | `places-photo-dot` | Possui fotos |

**Ajuste em relação ao spec:** o anel de favorito é **osso** (`#e8edea`), não
âmbar. Âmbar já codifica "quero conhecer" no miolo; um anel âmbar em volta de um
miolo âmbar seria ilegível e um anel âmbar em volta de um miolo verde sugeriria
falsamente uma mistura de status. Osso lê como destaque e não colide com nenhum
status.

- [ ] **Passo 1: Escrever o teste de GeoJSON que falha**

`src/lib/map/layers.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { buildPlacesGeoJson } from './layers'
import type { ExplorePlace } from '@/domain/place'

function place(overrides: Partial<ExplorePlace>): ExplorePlace {
  return {
    id: 'x',
    slug: 'x',
    name: 'X',
    description: '',
    latitude: -27.6,
    longitude: -48.5,
    municipality: 'Palhoça',
    stateCode: 'SC',
    category: 'serra',
    tags: [],
    coverImageUrl: null,
    source: 'mock',
    visitStatus: 'nao-visitado',
    isFavorite: false,
    photoCount: 0,
    lastVisitedAt: null,
    ...overrides,
  }
}

describe('buildPlacesGeoJson', () => {
  it('devolve uma FeatureCollection vazia sem lugares', () => {
    const result = buildPlacesGeoJson([])
    expect(result.type).toBe('FeatureCollection')
    expect(result.features).toHaveLength(0)
  })

  it('usa a ordem longitude, latitude exigida pelo GeoJSON', () => {
    const result = buildPlacesGeoJson([place({ latitude: -27.6, longitude: -48.5 })])
    expect(result.features[0]!.geometry.coordinates).toEqual([-48.5, -27.6])
  })

  it('expõe os três canais visuais como propriedades', () => {
    const result = buildPlacesGeoJson([
      place({ slug: 'a', visitStatus: 'visitado', isFavorite: true, photoCount: 12 }),
    ])
    const properties = result.features[0]!.properties

    expect(properties.slug).toBe('a')
    expect(properties.visitStatus).toBe('visitado')
    expect(properties.isFavorite).toBe(true)
    expect(properties.hasPhotos).toBe(true)
  })

  it('converte contagem de fotos em booleano', () => {
    const result = buildPlacesGeoJson([place({ photoCount: 0 })])
    expect(result.features[0]!.properties.hasPhotos).toBe(false)
  })

  it('usa o slug como id da feature, para permitir feature-state', () => {
    const result = buildPlacesGeoJson([place({ slug: 'urubici' })])
    expect(result.features[0]!.id).toBe('urubici')
  })
})
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```bash
npm test
```

Esperado: FALHA, módulo `./layers` não encontrado.

- [ ] **Passo 3: Implementar `src/lib/map/layers.ts`**

```ts
import type {
  CircleLayerSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl'
import type { ExplorePlace } from '@/domain/place'

export const PLACES_SOURCE_ID = 'places'

export const PLACE_LAYERS = {
  favoriteRing: 'places-favorite-ring',
  core: 'places-core',
  photoDot: 'places-photo-dot',
  selected: 'places-selected',
  label: 'places-label',
} as const

/** Propriedades levadas ao mapa. Só o que alguma camada realmente lê. */
export interface PlaceFeatureProperties {
  slug: string
  name: string
  visitStatus: string
  isFavorite: boolean
  hasPhotos: boolean
}

export interface PlaceFeature {
  type: 'Feature'
  id: string
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: PlaceFeatureProperties
}

export interface PlaceFeatureCollection {
  type: 'FeatureCollection'
  features: PlaceFeature[]
}

export function buildPlacesGeoJson(
  places: readonly ExplorePlace[],
): PlaceFeatureCollection {
  return {
    type: 'FeatureCollection',
    features: places.map((place) => ({
      type: 'Feature',
      id: place.slug,
      geometry: {
        type: 'Point',
        // GeoJSON é [longitude, latitude]. Trocar a ordem é o erro clássico.
        coordinates: [place.longitude, place.latitude],
      },
      properties: {
        slug: place.slug,
        name: place.name,
        visitStatus: place.visitStatus,
        isFavorite: place.isFavorite,
        hasPhotos: place.photoCount > 0,
      },
    })),
  }
}

// Cores duplicadas dos tokens CSS de propósito: o MapLibre desenha em WebGL e
// não enxerga variáveis CSS. Ao alterar um token, altere aqui também.
const VISITED = '#3fbf8f'
const WANTED = '#f0a32b'
const UNVISITED = '#7d8a85'
const HOLLOW = '#141a18'
const BONE = '#e8edea'

/** Miolo preenchido para visitado e quero conhecer; vazado para não visitado. */
const CORE_FILL: CircleLayerSpecification['paint'] = {
  'circle-color': [
    'match',
    ['get', 'visitStatus'],
    'visitado',
    VISITED,
    'quero-conhecer',
    WANTED,
    HOLLOW,
  ],
  'circle-stroke-color': [
    'match',
    ['get', 'visitStatus'],
    'visitado',
    VISITED,
    'quero-conhecer',
    WANTED,
    UNVISITED,
  ],
  'circle-stroke-width': 1.4,
  'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 3.5, 12, 6.5],
}

export function buildPlaceLayers(): Array<
  CircleLayerSpecification | SymbolLayerSpecification
> {
  return [
    {
      id: PLACE_LAYERS.favoriteRing,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      filter: ['==', ['get', 'isFavorite'], true],
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': BONE,
        'circle-stroke-width': 1,
        'circle-stroke-opacity': 0.55,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 7, 12, 11],
      },
    },
    {
      id: PLACE_LAYERS.core,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      paint: CORE_FILL,
    },
    {
      id: PLACE_LAYERS.photoDot,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      filter: ['==', ['get', 'hasPhotos'], true],
      paint: {
        'circle-color': BONE,
        'circle-opacity': 0.8,
        'circle-radius': 1.7,
        // Deslocado para o canto superior direito do pin.
        'circle-translate': [8, -8],
      },
    },
    {
      id: PLACE_LAYERS.selected,
      type: 'circle',
      source: PLACES_SOURCE_ID,
      // Sem seleção o filtro não casa com nada e a camada fica invisível.
      filter: ['==', ['get', 'slug'], '__none__'],
      paint: {
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': BONE,
        'circle-stroke-width': 1.2,
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 11, 12, 16],
      },
    },
    {
      id: PLACE_LAYERS.label,
      type: 'symbol',
      source: PLACES_SOURCE_ID,
      minzoom: 8.5,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 10.5,
        'text-letter-spacing': 0.06,
        'text-offset': [0, 1.3],
        'text-anchor': 'top',
        'text-max-width': 9,
        // Rótulo de pin nunca some por colisão: perder o nome do destino é
        // pior do que sobrepor um rótulo da base.
        'text-allow-overlap': false,
        'text-optional': true,
      },
      paint: {
        'text-color': '#c3ccc8',
        'text-halo-color': '#0a0c0b',
        'text-halo-width': 1.4,
      },
    },
  ]
}
```

- [ ] **Passo 4: Rodar e confirmar que passa**

```bash
npm test
```

- [ ] **Passo 5: Criar `src/components/explore/use-selected-place.ts`**

A seleção vive na URL desde já: recarregar a página mantém o painel aberto e o
link é compartilhável.

```ts
'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

export const SELECTED_PLACE_PARAM = 'place'

export function useSelectedPlace() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const slug = searchParams.get(SELECTED_PLACE_PARAM)

  const select = useCallback(
    (next: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (next) {
        params.set(SELECTED_PLACE_PARAM, next)
      } else {
        params.delete(SELECTED_PLACE_PARAM)
      }
      const query = params.toString()
      // `replace` e não `push`: selecionar pins não deve encher o histórico.
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    [pathname, router, searchParams],
  )

  return { slug, select }
}
```

- [ ] **Passo 6: Criar `src/components/map/PlacesLayer.tsx`**

```tsx
'use client'

import { useEffect } from 'react'
import type { GeoJSONSource } from 'maplibre-gl'
import type { ExplorePlace } from '@/domain/place'
import {
  PLACES_SOURCE_ID,
  PLACE_LAYERS,
  buildPlaceLayers,
  buildPlacesGeoJson,
} from '@/lib/map/layers'
import { useSelectedPlace } from '@/components/explore/use-selected-place'
import { useMapInstance } from './map-context'

interface PlacesLayerProps {
  places: ExplorePlace[]
}

export function PlacesLayer({ places }: PlacesLayerProps) {
  const map = useMapInstance()
  const { slug, select } = useSelectedPlace()

  // Registro da fonte e das camadas. Roda uma vez por instância de mapa.
  useEffect(() => {
    if (!map) return

    if (!map.getSource(PLACES_SOURCE_ID)) {
      map.addSource(PLACES_SOURCE_ID, {
        type: 'geojson',
        data: buildPlacesGeoJson([]),
      })
      for (const layer of buildPlaceLayers()) {
        map.addLayer(layer)
      }
    }

    return () => {
      // O mapa pode já ter sido destruído pelo MapCanvas.
      if (!map.getStyle()) return
      for (const id of Object.values(PLACE_LAYERS)) {
        if (map.getLayer(id)) map.removeLayer(id)
      }
      if (map.getSource(PLACES_SOURCE_ID)) map.removeSource(PLACES_SOURCE_ID)
    }
  }, [map])

  // Dados. Roda sempre que a lista filtrada muda.
  useEffect(() => {
    if (!map) return
    const source = map.getSource(PLACES_SOURCE_ID) as GeoJSONSource | undefined
    source?.setData(buildPlacesGeoJson(places))
  }, [map, places])

  // Realce da seleção.
  useEffect(() => {
    if (!map || !map.getLayer(PLACE_LAYERS.selected)) return
    map.setFilter(PLACE_LAYERS.selected, [
      '==',
      ['get', 'slug'],
      slug ?? '__none__',
    ])
  }, [map, slug])

  // Interação: clique seleciona, clique no vazio limpa, cursor vira ponteiro.
  useEffect(() => {
    if (!map) return

    function handlePlaceClick(event: maplibregl.MapLayerMouseEvent) {
      const feature = event.features?.[0]
      const clicked = feature?.properties?.slug
      if (typeof clicked === 'string') {
        select(clicked)
      }
    }

    function handleBackgroundClick(event: maplibregl.MapMouseEvent) {
      const hits = map!.queryRenderedFeatures(event.point, {
        layers: [PLACE_LAYERS.core],
      })
      if (hits.length === 0) select(null)
    }

    function enter() {
      map!.getCanvas().style.cursor = 'pointer'
    }
    function leave() {
      map!.getCanvas().style.cursor = ''
    }

    map.on('click', PLACE_LAYERS.core, handlePlaceClick)
    map.on('click', handleBackgroundClick)
    map.on('mouseenter', PLACE_LAYERS.core, enter)
    map.on('mouseleave', PLACE_LAYERS.core, leave)

    return () => {
      map.off('click', PLACE_LAYERS.core, handlePlaceClick)
      map.off('click', handleBackgroundClick)
      map.off('mouseenter', PLACE_LAYERS.core, enter)
      map.off('mouseleave', PLACE_LAYERS.core, leave)
    }
  }, [map, select])

  return null
}
```

`PlacesLayer` não renderiza DOM: existe apenas para amarrar o ciclo de vida das
camadas ao ciclo de vida do React. É deliberado, e é o padrão que a Tarefa 12
reutiliza para realçar resultados de descoberta.

- [ ] **Passo 7: Ligar no Explore**

`src/app/(app)/page.tsx` vira um componente de servidor que busca os dados e
delega o render ao cliente:

```tsx
import { placeRepository } from '@/lib/data'
import { ExploreView } from '@/components/explore/ExploreView'

export default async function ExplorePage() {
  const places = await placeRepository.listExplorePlaces()
  return <ExploreView places={places} />
}
```

Crie `src/components/explore/ExploreView.tsx`:

```tsx
'use client'

import type { ExplorePlace } from '@/domain/place'
import { PlacesLayer } from '@/components/map/PlacesLayer'

interface ExploreViewProps {
  places: ExplorePlace[]
}

export function ExploreView({ places }: ExploreViewProps) {
  return <PlacesLayer places={places} />
}
```

O componente parece supérfluo agora, e é: nas Tarefas 10 e 11 ele passa a
hospedar o painel e os filtros. Criá-lo já evita reescrever a página duas vezes.

- [ ] **Passo 8: Verificar no navegador**

```bash
npm run dev
```

Em `/`, confirme:

- 14 pins sobre Santa Catarina.
- Serra do Rio do Rastro: miolo verde (visitado), anel osso (favorito), ponto
  satélite (tem fotos) — os três canais simultâneos no mesmo pin.
- Morro da Igreja: miolo âmbar (quero conhecer) com anel osso.
- Garopaba: miolo vazado com contorno frio (não visitado), sem anel, sem ponto.
- Passar o mouse sobre um pin vira o cursor em ponteiro.
- Clicar num pin acrescenta `?place=<slug>` à URL e desenha o anel de seleção.
- Clicar no mapa vazio remove o parâmetro.
- Recarregar a página com `?place=urubici` mantém o anel de seleção.

- [ ] **Passo 9: Escrever `docs/decisions/0005-pins-como-camadas-data-driven.md`**

Conteúdo: **Contexto** — o brief listava cinco estados de pin como se fossem
mutuamente exclusivos, mas um lugar pode ser visitado, favorito e ter fotos ao
mesmo tempo; e havia a escolha entre marcadores HTML e camadas nativas.
**Decisão** — três canais visuais independentes (cor do miolo para status, anel
externo para favorito, ponto satélite para fotos), desenhados como *circle
layers* data-driven com expressões `match`, não como marcadores HTML.
**Motivos** — combinações ficam representáveis; o desenho acontece em WebGL e
escala para milhares de pontos sem custo de DOM; o resultado lê como cartografia
e não como interface colada sobre o mapa. **Ajuste** — o anel de favorito é osso
e não âmbar, porque âmbar já codifica "quero conhecer" e a sobreposição seria
ambígua. **Custo aceito** — as cores ficam duplicadas entre os tokens CSS e
`layers.ts`, porque o WebGL não enxerga variáveis CSS; a duplicação está
comentada no código.

- [ ] **Passo 10: Completar `docs/MAP-STRATEGY.md`**

Preencha a seção reservada na Tarefa 8 com: a tabela dos três canais visuais; a
lista das cinco camadas de pin em ordem de desenho e o papel de cada uma; a nota
sobre a duplicação de cores entre CSS e WebGL; e a explicação do padrão
"componente sem DOM" do `PlacesLayer`.

- [ ] **Passo 11: Verificar, atualizar o CHANGELOG e commitar**

```bash
npm run lint && npm run typecheck && npm test
```

CHANGELOG, sob `### Adicionado`:

```markdown
- Pins de lugares no mapa com três canais visuais independentes: cor do miolo
  para o status de visita, anel externo para favorito e ponto satélite para
  lugares com fotos
- Seleção de lugar por clique no pin, refletida na URL e preservada ao recarregar
- ADR 0005 registrando os pins como camadas data-driven
```

```bash
git add -A
git commit -m "feat: pins de lugares com estados e selecao pela url"
```

---

## Tarefa 10 — Painel do lugar

**Arquivos:**
- Criar: `src/domain/dates.ts`, `src/domain/dates.test.ts`
- Criar: `src/components/explore/PlacePanel.tsx`,
  `src/components/explore/PlaceActions.tsx`,
  `src/components/explore/VisitStatusBadge.tsx`
- Modificar: `src/components/explore/ExploreView.tsx`
- Modificar: `CHANGELOG.md`

**Interfaces:**
- Consome: `ExplorePlace`, `CATEGORY_LABELS` de `@/domain/place`;
  `haversineKm`, `formatDistanceKm`, `formatDurationMinutes` de `@/domain/geo`;
  `AVERAGE_SPEED_KMH`, `ROAD_SINUOSITY_FACTOR` de `@/domain/discovery`;
  `DEFAULT_ORIGIN`, `DEFAULT_ORIGIN_LABEL` de `@/mocks/user`;
  `OverlayPanel` de `@/components/layout/OverlayPanel`;
  `useSelectedPlace` de `./use-selected-place`.
- Produz:
  - `formatVisitDate(isoDate: string): string` — `'2026-07-26'` → `'26 JUL 2026'`
  - `<PlacePanel place={ExplorePlace} onClose={() => void} />`
  - `<VisitStatusBadge status={VisitStatus} />`

### Painel contextual, não modal

O painel ocupa a faixa direita e desliza sobre o mapa. Não escurece o fundo e não
bloqueia interação: o mapa continua arrastável e clicável com o painel aberto,
porque comparar o lugar selecionado com os vizinhos é justamente o que se faz
nesta tela. Um modal central mataria isso.

- [ ] **Passo 1: Escrever o teste de data que falha**

`src/domain/dates.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { formatVisitDate } from './dates'

describe('formatVisitDate', () => {
  it('formata no vocabulário de diário de viagem', () => {
    expect(formatVisitDate('2026-07-26')).toBe('26 JUL 2026')
  })

  it('preserva o dia independentemente do fuso', () => {
    // `new Date('2026-01-01')` é meia-noite UTC e voltaria 31 DEZ 2025 no
    // horário de Brasília. O parse precisa ser manual.
    expect(formatVisitDate('2026-01-01')).toBe('01 JAN 2026')
  })

  it('mantém dois dígitos no dia', () => {
    expect(formatVisitDate('2026-03-05')).toBe('05 MAR 2026')
  })

  it('devolve string vazia para entrada inválida', () => {
    expect(formatVisitDate('não é data')).toBe('')
  })
})
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```bash
npm test
```

- [ ] **Passo 3: Implementar `src/domain/dates.ts`**

```ts
const MONTHS = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ',
] as const

/**
 * `'2026-07-26'` → `'26 JUL 2026'`.
 *
 * O parse é manual de propósito: `new Date('2026-07-26')` é interpretado como
 * meia-noite UTC e, no fuso de Brasília, exibiria o dia anterior. Datas de
 * visita são datas de calendário, não instantes.
 */
export function formatVisitDate(isoDate: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) return ''

  const [, year, month, day] = match
  const monthLabel = MONTHS[Number(month) - 1]
  if (!monthLabel) return ''

  return `${day} ${monthLabel} ${year}`
}
```

- [ ] **Passo 4: Rodar e confirmar que passa**

```bash
npm test
```

- [ ] **Passo 5: Criar `src/components/explore/VisitStatusBadge.tsx`**

```tsx
import type { VisitStatus } from '@/domain/place'
import { cn } from '@/lib/utils/cn'

const STATUS_LABEL: Record<VisitStatus, string> = {
  visitado: 'Visitado',
  'quero-conhecer': 'Quero conhecer',
  'nao-visitado': 'Não visitado',
}

// Mesmas cores dos pins, para que painel e mapa contem a mesma história.
const STATUS_CLASS: Record<VisitStatus, string> = {
  visitado: 'text-visited before:bg-visited',
  'quero-conhecer': 'text-wanted before:bg-wanted',
  'nao-visitado': 'text-ink-faint before:bg-unvisited',
}

export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[10px] uppercase',
        'tracking-[0.14em] before:h-1.5 before:w-1.5 before:rounded-full',
        'before:content-[""]',
        STATUS_CLASS[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}
```

- [ ] **Passo 6: Criar `src/components/explore/PlaceActions.tsx`**

```tsx
'use client'

import type { ExplorePlace } from '@/domain/place'
import { Button } from '@/components/ui/Button'

/**
 * Rota externa. É a única ação que funciona sem banco, porque não escreve nada:
 * apenas delega a navegação a quem sabe navegar.
 */
function routeUrl(place: ExplorePlace): string {
  const destination = `${place.latitude},${place.longitude}`
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`
}

export function PlaceActions({ place }: { place: ExplorePlace }) {
  return (
    <div className="border-t border-line px-5 py-4">
      <div className="grid grid-cols-2 gap-1.5">
        <Button size="sm" disabled>
          Salvar
        </Button>
        <Button size="sm" disabled>
          Quero conhecer
        </Button>
        <Button size="sm" disabled>
          Marcar visitado
        </Button>
        <Button size="sm" disabled>
          Criar viagem
        </Button>
        <a
          href={routeUrl(place)}
          target="_blank"
          rel="noreferrer"
          className="col-span-2"
        >
          <Button size="sm" variant="solid" className="w-full">
            Abrir rota
          </Button>
        </a>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-ink-faint">
        Salvar, marcar visita e criar viagem gravam dados e ficam disponíveis
        quando o banco for conectado.
      </p>
    </div>
  )
}
```

Uma única frase explica os quatro botões desabilitados. Botão desabilitado sem
explicação é pior do que botão ausente.

- [ ] **Passo 7: Criar `src/components/explore/PlacePanel.tsx`**

```tsx
'use client'

import { formatVisitDate } from '@/domain/dates'
import {
  AVERAGE_SPEED_KMH,
  ROAD_SINUOSITY_FACTOR,
} from '@/domain/discovery'
import {
  formatDistanceKm,
  formatDurationMinutes,
  haversineKm,
} from '@/domain/geo'
import { CATEGORY_LABELS, type ExplorePlace } from '@/domain/place'
import { DEFAULT_ORIGIN, DEFAULT_ORIGIN_LABEL } from '@/mocks/user'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { Stat } from '@/components/ui/Stat'
import { PlaceActions } from './PlaceActions'
import { VisitStatusBadge } from './VisitStatusBadge'

interface PlacePanelProps {
  place: ExplorePlace
  onClose: () => void
}

export function PlacePanel({ place, onClose }: PlacePanelProps) {
  const straightLineKm = haversineKm(DEFAULT_ORIGIN, place)
  const roadKm = straightLineKm * ROAD_SINUOSITY_FACTOR
  const minutes = (roadKm / AVERAGE_SPEED_KMH) * 60

  return (
    <OverlayPanel side="right">
      <header className="flex items-start gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0 flex-1">
          <span className="instrument-label">
            {CATEGORY_LABELS[place.category]}
          </span>
          <h1 className="mt-1 text-lg leading-tight font-medium text-ink">
            {place.name}
          </h1>
          <p className="mt-1 text-xs text-ink-muted">
            {place.municipality} · {place.stateCode}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel"
          className="shrink-0 px-1 text-lg leading-none text-ink-faint
                     transition-colors hover:text-ink"
        >
          ×
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {/* Faixa de fotografia. Sem foto, o espaço é assumido em vez de
            desaparecer: fotografia é conteúdo central deste produto. */}
        <div className="flex h-40 items-center justify-center border-b border-line bg-raised">
          {place.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={place.coverImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="instrument-label">
              {place.photoCount > 0
                ? `${place.photoCount} fotografias`
                : 'Sem fotografias'}
            </span>
          )}
        </div>

        <div className="flex gap-8 border-b border-line px-5 py-4">
          <Stat
            label="Distância"
            value={formatDistanceKm(roadKm)}
            unit="km"
          />
          <Stat label="Tempo" value={formatDurationMinutes(minutes)} />
        </div>

        <div className="flex items-center gap-4 border-b border-line px-5 py-3">
          <VisitStatusBadge status={place.visitStatus} />
          {place.lastVisitedAt ? (
            <span className="instrument-value text-[10px] text-ink-faint">
              {formatVisitDate(place.lastVisitedAt)}
            </span>
          ) : null}
        </div>

        {place.description ? (
          <p className="px-5 py-4 text-sm leading-relaxed text-ink-muted">
            {place.description}
          </p>
        ) : null}

        {place.tags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5 px-5 pb-4">
            {place.tags.map((tag) => (
              <li
                key={tag}
                className="border border-line px-1.5 py-0.5 text-[10px]
                           tracking-[0.08em] text-ink-faint"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}

        <p className="px-5 pb-4 text-[10px] leading-relaxed text-ink-faint">
          Distância e tempo são estimativas em linha reta a partir de{' '}
          {DEFAULT_ORIGIN_LABEL}, corrigidas por um fator de estrada. Não
          substituem um roteador.
        </p>
      </div>

      <PlaceActions place={place} />
    </OverlayPanel>
  )
}
```

A nota final sobre a estimativa é obrigatória: os números vêm de haversine com
fator fixo, e apresentá-los sem ressalva seria vender aproximação como medida.

- [ ] **Passo 8: Ligar o painel ao Explore**

`src/components/explore/ExploreView.tsx`:

```tsx
'use client'

import type { ExplorePlace } from '@/domain/place'
import { PlacesLayer } from '@/components/map/PlacesLayer'
import { PlacePanel } from './PlacePanel'
import { useSelectedPlace } from './use-selected-place'

interface ExploreViewProps {
  places: ExplorePlace[]
}

export function ExploreView({ places }: ExploreViewProps) {
  const { slug, select } = useSelectedPlace()
  const selected = places.find((place) => place.slug === slug) ?? null

  return (
    <>
      <PlacesLayer places={places} />
      {selected ? (
        <PlacePanel place={selected} onClose={() => select(null)} />
      ) : null}
    </>
  )
}
```

- [ ] **Passo 9: Verificar no navegador**

```bash
npm run dev
```

Confirme:

- Clicar num pin abre o painel à direita, sobre o mapa, sem escurecer o fundo.
- O mapa continua arrastável com o painel aberto.
- Serra do Rio do Rastro mostra Visitado em verde, a data `26 JUL 2026` e
  `12 fotografias` na faixa superior.
- Garopaba mostra Não visitado e `Sem fotografias`.
- Distância e tempo aparecem em mono, com a ressalva sobre estimativa.
- "Abrir rota" abre o Google Maps em nova aba, com o destino correto.
- Os quatro botões desabilitados continuam legíveis e a frase explica o porquê.
- O botão × fecha o painel e limpa `?place=` da URL.
- Um `?place=slug-inexistente` na URL não quebra a tela: nenhum painel abre.

- [ ] **Passo 10: Verificar, atualizar o CHANGELOG e commitar**

```bash
npm run lint && npm run typecheck && npm test
```

CHANGELOG, sob `### Adicionado`:

```markdown
- Painel lateral do lugar, aberto ao selecionar um pin, com categoria,
  localização, distância e tempo estimados, status de visita, fotografias,
  descrição e etiquetas
- Ação "Abrir rota", que delega a navegação a um aplicativo de rotas externo
- Formatação de datas de visita no vocabulário de diário de viagem
```

```bash
git add -A
git commit -m "feat: painel lateral do lugar"
```

---

## Tarefa 11 — Filtros na URL

**Arquivos:**
- Criar: `src/components/explore/use-explore-filters.ts`,
  `src/components/explore/FilterRail.tsx`,
  `src/components/explore/visible-places-context.tsx`
- Modificar: `src/components/explore/ExploreView.tsx`,
  `src/components/layout/StatusBar.tsx`, `src/app/(app)/layout.tsx`
- Criar: `docs/decisions/0006-estado-de-filtros-na-url.md`
- Modificar: `CHANGELOG.md`

**Interfaces:**
- Consome: `ExploreFilters`, `DEFAULT_EXPLORE_FILTERS`, `filterPlaces`,
  `RADIUS_OPTIONS_KM` de `@/domain/filters`; `PLACE_CATEGORIES`,
  `CATEGORY_LABELS` de `@/domain/place`; `Chip`, `Toggle`, `Button` de
  `@/components/ui/*`.
- Produz:
  - `useExploreFilters(): { filters: ExploreFilters; setFilters: (f: ExploreFilters) => void; reset: () => void; isDefault: boolean }`
  - `<FilterRail filters setFilters reset isDefault resultCount />`
  - `<VisiblePlacesProvider>`, `useVisiblePlaceCount()`,
    `useSetVisiblePlaceCount()`

### Contrato de URL

```
/?cat=serra,mirante&raio=150&status=nao-visitado,quero-conhecer&fav=1&place=urubici
```

Parâmetro ausente significa "sem restrição". Valor inválido é ignorado, nunca
quebra a tela — alguém vai editar essa URL à mão.

- [ ] **Passo 1: Criar `src/components/explore/use-explore-filters.ts`**

```ts
'use client'

import { useCallback, useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  DEFAULT_EXPLORE_FILTERS,
  type ExploreFilters,
} from '@/domain/filters'
import { PLACE_CATEGORIES, type PlaceCategory, type VisitStatus } from '@/domain/place'

const VISIT_STATUSES: VisitStatus[] = [
  'nao-visitado',
  'quero-conhecer',
  'visitado',
]

function parseList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return []
  const allowedSet = new Set<string>(allowed)
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is T => allowedSet.has(value))
}

function parseRadius(raw: string | null): number | null {
  if (!raw) return null
  const value = Number(raw)
  return Number.isFinite(value) && value > 0 ? value : null
}

export function useExploreFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const filters = useMemo<ExploreFilters>(
    () => ({
      categories: parseList<PlaceCategory>(
        searchParams.get('cat'),
        PLACE_CATEGORIES,
      ),
      radiusKm: parseRadius(searchParams.get('raio')),
      visitStatus: parseList<VisitStatus>(
        searchParams.get('status'),
        VISIT_STATUSES,
      ),
      favoritesOnly: searchParams.get('fav') === '1',
    }),
    [searchParams],
  )

  const setFilters = useCallback(
    (next: ExploreFilters) => {
      const params = new URLSearchParams(searchParams.toString())

      const assign = (key: string, value: string | null) => {
        if (value) params.set(key, value)
        else params.delete(key)
      }

      assign('cat', next.categories.join(',') || null)
      assign('raio', next.radiusKm ? String(next.radiusKm) : null)
      assign('status', next.visitStatus.join(',') || null)
      assign('fav', next.favoritesOnly ? '1' : null)

      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  const reset = useCallback(() => {
    setFilters(DEFAULT_EXPLORE_FILTERS)
  }, [setFilters])

  const isDefault =
    filters.categories.length === 0 &&
    filters.radiusKm === null &&
    filters.visitStatus.length === 0 &&
    !filters.favoritesOnly

  return { filters, setFilters, reset, isDefault }
}
```

- [ ] **Passo 2: Criar `src/components/explore/visible-places-context.tsx`**

A statusbar mora no layout e a contagem nasce na página. Este contexto é a ponte,
e existe só para isso.

```tsx
'use client'

import { createContext, useContext, useMemo, useState } from 'react'

interface VisiblePlacesValue {
  count: number | null
  setCount: (count: number | null) => void
}

const VisiblePlacesContext = createContext<VisiblePlacesValue | null>(null)

export function VisiblePlacesProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [count, setCount] = useState<number | null>(null)
  const value = useMemo(() => ({ count, setCount }), [count])

  return (
    <VisiblePlacesContext.Provider value={value}>
      {children}
    </VisiblePlacesContext.Provider>
  )
}

/** `null` quando a rota atual não lista lugares. */
export function useVisiblePlaceCount(): number | null {
  return useContext(VisiblePlacesContext)?.count ?? null
}

export function useSetVisiblePlaceCount(): (count: number | null) => void {
  const context = useContext(VisiblePlacesContext)
  return context ? context.setCount : () => {}
}
```

- [ ] **Passo 3: Criar `src/components/explore/FilterRail.tsx`**

```tsx
'use client'

import type { ExploreFilters } from '@/domain/filters'
import { RADIUS_OPTIONS_KM } from '@/domain/filters'
import {
  CATEGORY_LABELS,
  PLACE_CATEGORIES,
  type PlaceCategory,
  type VisitStatus,
} from '@/domain/place'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Toggle } from '@/components/ui/Toggle'

const STATUS_OPTIONS: Array<{ value: VisitStatus; label: string }> = [
  { value: 'nao-visitado', label: 'Não visitados' },
  { value: 'quero-conhecer', label: 'Quero conhecer' },
  { value: 'visitado', label: 'Já visitados' },
]

function toggleInList<T>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value]
}

interface FilterRailProps {
  filters: ExploreFilters
  setFilters: (filters: ExploreFilters) => void
  reset: () => void
  isDefault: boolean
  resultCount: number
  totalCount: number
}

export function FilterRail({
  filters,
  setFilters,
  reset,
  isDefault,
  resultCount,
  totalCount,
}: FilterRailProps) {
  return (
    <OverlayPanel side="left">
      <div className="flex-1 overflow-y-auto">
        <section className="border-b border-line px-4 py-4">
          <span className="instrument-label">Categoria</span>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {PLACE_CATEGORIES.map((category: PlaceCategory) => (
              <Chip
                key={category}
                active={filters.categories.includes(category)}
                onClick={() =>
                  setFilters({
                    ...filters,
                    categories: toggleInList(filters.categories, category),
                  })
                }
              >
                {CATEGORY_LABELS[category]}
              </Chip>
            ))}
          </div>
        </section>

        <section className="border-b border-line px-4 py-4">
          <span className="instrument-label">Raio em linha reta</span>
          <div className="mt-2.5 flex flex-wrap gap-1">
            {RADIUS_OPTIONS_KM.map((radius) => (
              <Chip
                key={radius}
                active={filters.radiusKm === radius}
                onClick={() =>
                  setFilters({
                    ...filters,
                    radiusKm: filters.radiusKm === radius ? null : radius,
                  })
                }
              >
                {radius} km
              </Chip>
            ))}
          </div>
        </section>

        <section className="border-b border-line px-4 py-4">
          <span className="instrument-label">Situação</span>
          <div className="mt-1.5">
            {STATUS_OPTIONS.map((option) => (
              <Toggle
                key={option.value}
                label={option.label}
                checked={filters.visitStatus.includes(option.value)}
                onChange={() =>
                  setFilters({
                    ...filters,
                    visitStatus: toggleInList(filters.visitStatus, option.value),
                  })
                }
              />
            ))}
            <Toggle
              label="Somente favoritos"
              checked={filters.favoritesOnly}
              onChange={(checked) =>
                setFilters({ ...filters, favoritesOnly: checked })
              }
            />
          </div>
        </section>
      </div>

      <div className="flex items-center justify-between border-t border-line px-4 py-3">
        <span className="instrument-value text-[10px] text-ink-faint">
          {resultCount} / {totalCount}
        </span>
        <Button size="sm" variant="ghost" onClick={reset} disabled={isDefault}>
          Limpar
        </Button>
      </div>
    </OverlayPanel>
  )
}
```

O rótulo "Raio em linha reta" é literal de propósito: o filtro mede distância
reta, e chamá-lo apenas de "distância" sugeriria quilometragem de estrada.

- [ ] **Passo 4: Aplicar os filtros no Explore**

`src/components/explore/ExploreView.tsx`:

```tsx
'use client'

import { useEffect, useMemo } from 'react'
import { filterPlaces } from '@/domain/filters'
import type { ExplorePlace } from '@/domain/place'
import { DEFAULT_ORIGIN } from '@/mocks/user'
import { PlacesLayer } from '@/components/map/PlacesLayer'
import { FilterRail } from './FilterRail'
import { PlacePanel } from './PlacePanel'
import { useExploreFilters } from './use-explore-filters'
import { useSelectedPlace } from './use-selected-place'
import { useSetVisiblePlaceCount } from './visible-places-context'

interface ExploreViewProps {
  places: ExplorePlace[]
}

export function ExploreView({ places }: ExploreViewProps) {
  const { filters, setFilters, reset, isDefault } = useExploreFilters()
  const { slug, select } = useSelectedPlace()
  const setVisibleCount = useSetVisiblePlaceCount()

  const visible = useMemo(
    () => filterPlaces(places, filters, DEFAULT_ORIGIN),
    [places, filters],
  )

  useEffect(() => {
    setVisibleCount(visible.length)
    return () => setVisibleCount(null)
  }, [visible.length, setVisibleCount])

  // A seleção sobrevive à filtragem: se o lugar aberto sair do filtro, o painel
  // continua aberto. Fechá-lo sozinho pareceria um bug para quem só mexeu num
  // filtro sem intenção de fechar nada.
  const selected = places.find((place) => place.slug === slug) ?? null

  return (
    <>
      <PlacesLayer places={visible} />
      <FilterRail
        filters={filters}
        setFilters={setFilters}
        reset={reset}
        isDefault={isDefault}
        resultCount={visible.length}
        totalCount={places.length}
      />
      {selected ? (
        <PlacePanel place={selected} onClose={() => select(null)} />
      ) : null}
    </>
  )
}
```

- [ ] **Passo 5: Envolver o layout no provider e mostrar a contagem**

Em `src/app/(app)/layout.tsx`, envolva o conteúdo com `VisiblePlacesProvider`
por dentro de `MapProvider`:

```tsx
<MapProvider>
  <VisiblePlacesProvider>
    {/* … shell inalterado … */}
  </VisiblePlacesProvider>
</MapProvider>
```

Em `src/components/layout/StatusBar.tsx`, acrescente a contagem entre o zoom e a
origem:

```tsx
const count = useVisiblePlaceCount()

// …

{count !== null ? (
  <span className="instrument-value text-[10px] text-ink-faint">
    ● {count} {count === 1 ? 'lugar' : 'lugares'}
  </span>
) : null}
```

Importe `useVisiblePlaceCount` de
`@/components/explore/visible-places-context`.

- [ ] **Passo 6: Verificar no navegador**

```bash
npm run dev
```

Confirme:

- Clicar em "Serra" deixa apenas serras no mapa; a URL ganha `?cat=serra`; a
  statusbar e o rodapé da trilha mostram a nova contagem.
- Selecionar "150 km" reduz para os lugares dentro do raio a partir de Palhoça.
- Combinar categoria e favoritos aplica **E**, não OU.
- Colar a URL completa numa aba nova reproduz exatamente o mesmo estado.
- Voltar pelo botão do navegador **não** desfaz um filtro por vez: como
  `setFilters` usa `router.replace`, cada mudança substitui a mesma entrada de
  histórico, e voltar sai direto do Explore para a página anterior, sem passar
  pelos filtros intermediários.
- Editar a URL para `?cat=inexistente&raio=abc` não quebra: os valores inválidos
  são ignorados e o mapa mostra tudo.
- "Limpar" fica desabilitado quando não há filtro ativo.

- [ ] **Passo 7: Escrever `docs/decisions/0006-estado-de-filtros-na-url.md`**

Conteúdo: **Contexto** — o Explore tem quatro dimensões de filtro mais a seleção
de lugar, e a alternativa natural seria uma biblioteca de estado global.
**Decisão** — a URL é a fonte única desse estado, lida e escrita por
`useExploreFilters` e `useSelectedPlace` com `router.replace`. **Motivos** —
zero dependências; links compartilháveis e favoritáveis; botão voltar funciona
sem trabalho extra; o estado sobrevive a refresh. **Contrato** — a grade de
parâmetros com o significado de cada um e a regra de que ausência significa "sem
restrição" e valor inválido é ignorado. **Consequências** — os componentes leem
`useSearchParams` e precisam ser de cliente; usamos `replace` em vez de `push`
para não encher o histórico a cada clique de chip; e a serialização precisa ser
mantida em sincronia com os tipos do domínio, o que é o custo aceito.

- [ ] **Passo 8: Verificar, atualizar o CHANGELOG e commitar**

```bash
npm run lint && npm run typecheck && npm test
```

CHANGELOG, sob `### Adicionado`:

```markdown
- Trilha de filtros por categoria, raio, situação de visita e favoritos
- Estado de filtros e seleção mantido na URL, tornando qualquer recorte do mapa
  compartilhável e reproduzível
- Contagem de lugares visíveis na barra de status
- ADR 0006 registrando a URL como fonte do estado de exploração
```

```bash
git add -A
git commit -m "feat: filtros do explore com estado na url"
```

---

## Tarefa 12 — "Para onde vamos?"

**Arquivos:**
- Criar: `src/components/explore/DiscoveryForm.tsx`,
  `src/components/explore/DiscoveryResults.tsx`,
  `src/components/explore/DiscoveryView.tsx`
- Criar: `src/components/explore/DiscoveryLauncher.tsx`
- Modificar: `src/app/(app)/descobrir/page.tsx`,
  `src/components/explore/ExploreView.tsx`
- Modificar: `CHANGELOG.md`

**Interfaces:**
- Consome: `findDestinations`, `DiscoveryQuery`, `DiscoveryResult`,
  `TIME_BUDGET_LABELS`, `TIME_BUDGET_MINUTES` de `@/domain/discovery`;
  `RADIUS_OPTIONS_KM` de `@/domain/filters`; `placeRepository` de `@/lib/data`.
- Produz: `<DiscoveryView places={ExplorePlace[]} />`, `<DiscoveryLauncher />`.

- [ ] **Passo 1: Criar `src/components/explore/DiscoveryLauncher.tsx`**

O ponto de entrada no Explore. Bloco retangular ancorado sobre o mapa, não um
botão flutuante redondo.

```tsx
import Link from 'next/link'

export function DiscoveryLauncher() {
  return (
    <Link
      href="/descobrir"
      className="pointer-events-auto absolute bottom-5 left-1/2 flex
                 -translate-x-1/2 items-center gap-3 border border-accent
                 bg-accent px-5 py-2.5 text-[11px] font-semibold
                 tracking-[0.16em] text-void uppercase transition-opacity
                 hover:opacity-90"
    >
      Para onde vamos?
      <span aria-hidden>→</span>
    </Link>
  )
}
```

Acrescente `<DiscoveryLauncher />` ao retorno de `ExploreView`, depois de
`<FilterRail />`.

- [ ] **Passo 2: Criar `src/components/explore/DiscoveryForm.tsx`**

```tsx
'use client'

import {
  TIME_BUDGET_LABELS,
  TIME_BUDGET_MINUTES,
  type DiscoveryQuery,
  type TimeBudget,
} from '@/domain/discovery'
import { RADIUS_OPTIONS_KM } from '@/domain/filters'
import {
  CATEGORY_LABELS,
  PLACE_CATEGORIES,
  type PlaceCategory,
} from '@/domain/place'
import { DEFAULT_ORIGIN_LABEL } from '@/mocks/user'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { Toggle } from '@/components/ui/Toggle'

const TIME_BUDGETS = Object.keys(TIME_BUDGET_MINUTES) as TimeBudget[]

interface DiscoveryFormProps {
  query: DiscoveryQuery
  onChange: (query: DiscoveryQuery) => void
  onSubmit: () => void
}

export function DiscoveryForm({ query, onChange, onSubmit }: DiscoveryFormProps) {
  return (
    <OverlayPanel side="left" width={272}>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
        className="flex flex-1 flex-col overflow-hidden"
      >
        <div className="flex-1 overflow-y-auto">
          <section className="border-b border-line px-4 py-4">
            <span className="instrument-label">Partida</span>
            <p className="instrument-value mt-1.5 text-sm text-ink">
              {DEFAULT_ORIGIN_LABEL}
            </p>
            <p className="mt-1 text-[10px] text-ink-faint">
              Escolher outra origem entra numa próxima etapa.
            </p>
          </section>

          <section className="border-b border-line px-4 py-4">
            <span className="instrument-label">Tempo disponível</span>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {TIME_BUDGETS.map((budget) => (
                <Chip
                  key={budget}
                  active={query.timeBudget === budget}
                  onClick={() => onChange({ ...query, timeBudget: budget })}
                >
                  {TIME_BUDGET_LABELS[budget]}
                </Chip>
              ))}
            </div>
          </section>

          <section className="border-b border-line px-4 py-4">
            <span className="instrument-label">Distância máxima</span>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {RADIUS_OPTIONS_KM.map((radius) => (
                <Chip
                  key={radius}
                  active={query.maxDistanceKm === radius}
                  onClick={() => onChange({ ...query, maxDistanceKm: radius })}
                >
                  {radius} km
                </Chip>
              ))}
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
              Quilometragem de estrada estimada, só de ida.
            </p>
          </section>

          <section className="border-b border-line px-4 py-4">
            <span className="instrument-label">Categorias</span>
            <div className="mt-2.5 flex flex-wrap gap-1">
              {PLACE_CATEGORIES.map((category: PlaceCategory) => (
                <Chip
                  key={category}
                  active={query.categories.includes(category)}
                  onClick={() =>
                    onChange({
                      ...query,
                      categories: query.categories.includes(category)
                        ? query.categories.filter((item) => item !== category)
                        : [...query.categories, category],
                    })
                  }
                >
                  {CATEGORY_LABELS[category]}
                </Chip>
              ))}
            </div>
          </section>

          <section className="px-4 py-4">
            <Toggle
              label="Somente lugares não visitados"
              checked={query.onlyUnvisited}
              onChange={(checked) => onChange({ ...query, onlyUnvisited: checked })}
            />
            <Toggle
              label="Somente favoritos"
              checked={query.onlyFavorites}
              onChange={(checked) => onChange({ ...query, onlyFavorites: checked })}
            />
          </section>
        </div>

        <div className="border-t border-line p-3">
          <Button type="submit" variant="solid" className="w-full">
            Encontrar destino
          </Button>
        </div>
      </form>
    </OverlayPanel>
  )
}
```

- [ ] **Passo 3: Criar `src/components/explore/DiscoveryResults.tsx`**

```tsx
'use client'

import type { DiscoveryResult } from '@/domain/discovery'
import { formatDistanceKm, formatDurationMinutes } from '@/domain/geo'
import { CATEGORY_LABELS } from '@/domain/place'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { VisitStatusBadge } from './VisitStatusBadge'

interface DiscoveryResultsProps {
  results: DiscoveryResult[]
  onSelect: (slug: string) => void
}

export function DiscoveryResults({ results, onSelect }: DiscoveryResultsProps) {
  return (
    <OverlayPanel side="right" width={340}>
      <header className="border-b border-line px-5 py-4">
        <span className="instrument-label">Destinos possíveis</span>
        <p className="instrument-value mt-1 text-lg text-ink">
          {results.length}
        </p>
      </header>

      {results.length === 0 ? (
        <div className="flex flex-1 flex-col justify-center gap-2 px-5">
          <p className="text-sm leading-relaxed text-ink-muted">
            Nenhum destino cabe nesses limites.
          </p>
          <p className="text-xs leading-relaxed text-ink-faint">
            Aumente a distância, o tempo disponível, ou remova alguma categoria.
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {results.map((result) => (
            <li key={result.place.slug}>
              <button
                type="button"
                onClick={() => onSelect(result.place.slug)}
                className="w-full border-b border-line px-5 py-3.5 text-left
                           transition-colors hover:bg-overlay"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-ink">{result.place.name}</span>
                  <span className="instrument-value shrink-0 text-xs text-accent">
                    {formatDistanceKm(result.estimatedRoadKm)} km
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-[10px] tracking-[0.1em] text-ink-faint uppercase">
                    {CATEGORY_LABELS[result.place.category]}
                  </span>
                  <span className="instrument-value text-[10px] text-ink-faint">
                    {formatDurationMinutes(result.estimatedRoundTripMinutes)} ida
                    e volta
                  </span>
                </div>
                <div className="mt-1.5">
                  <VisitStatusBadge status={result.place.visitStatus} />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="border-t border-line px-5 py-3 text-[10px] leading-relaxed text-ink-faint">
        Estimativas em linha reta com fator de estrada, a 55 km/h médios,
        reservando um quarto do tempo para paradas. Não substituem um roteador.
      </p>
    </OverlayPanel>
  )
}
```

- [ ] **Passo 4: Criar `src/components/explore/DiscoveryView.tsx`**

```tsx
'use client'

import { useMemo, useState } from 'react'
import { findDestinations, type DiscoveryQuery } from '@/domain/discovery'
import type { ExplorePlace } from '@/domain/place'
import { DEFAULT_ORIGIN } from '@/mocks/user'
import { PlacesLayer } from '@/components/map/PlacesLayer'
import { DiscoveryForm } from './DiscoveryForm'
import { DiscoveryResults } from './DiscoveryResults'
import { useSelectedPlace } from './use-selected-place'

const INITIAL_QUERY: DiscoveryQuery = {
  origin: DEFAULT_ORIGIN,
  timeBudget: '4h',
  maxDistanceKm: 150,
  categories: [],
  onlyUnvisited: true,
  onlyFavorites: false,
}

export function DiscoveryView({ places }: { places: ExplorePlace[] }) {
  const [query, setQuery] = useState<DiscoveryQuery>(INITIAL_QUERY)
  const [submitted, setSubmitted] = useState<DiscoveryQuery | null>(null)
  const { select } = useSelectedPlace()

  const results = useMemo(
    () => (submitted ? findDestinations(places, submitted) : null),
    [places, submitted],
  )

  // Antes de buscar, o mapa mostra tudo. Depois, só o que cabe — o recorte é a
  // resposta visual da busca.
  const visible = results ? results.map((result) => result.place) : places

  return (
    <>
      <PlacesLayer places={visible} />
      <DiscoveryForm
        query={query}
        onChange={setQuery}
        onSubmit={() => setSubmitted(query)}
      />
      {results ? (
        <DiscoveryResults results={results} onSelect={select} />
      ) : null}
    </>
  )
}
```

- [ ] **Passo 5: Ligar a rota**

`src/app/(app)/descobrir/page.tsx`:

```tsx
import { placeRepository } from '@/lib/data'
import { DiscoveryView } from '@/components/explore/DiscoveryView'

export default async function DescobrirPage() {
  const places = await placeRepository.listExplorePlaces()
  return <DiscoveryView places={places} />
}
```

- [ ] **Passo 6: Verificar no navegador**

```bash
npm run dev
```

Confirme:

- O bloco "PARA ONDE VAMOS?" aparece ancorado embaixo no Explore e leva a
  `/descobrir`.
- O mapa **não** recarrega na transição — posição e zoom permanecem.
- Com 4 horas, 150 km e somente não visitados, "Encontrar destino" devolve uma
  lista e o mapa passa a mostrar apenas esses pins.
- A lista vem ordenada do mais distante ao mais próximo.
- Com 2 horas e 300 km, a Serra do Rio do Rastro é descartada por tempo, mesmo
  cabendo na distância. É a verificação que prova que o tempo de volta conta.
- Marcar "somente favoritos" junto com uma categoria improvável produz o estado
  vazio com a orientação do que afrouxar.
- Clicar num resultado seleciona o lugar e acrescenta `?place=` à URL.

- [ ] **Passo 7: Verificar, atualizar o CHANGELOG e commitar**

```bash
npm run lint && npm run typecheck && npm test
```

CHANGELOG, sob `### Adicionado`:

```markdown
- Área "Para onde vamos?" com tempo disponível, distância máxima, categorias e
  filtros de não visitados e favoritos
- Resultados de descoberta ordenados por distância e recortados no mapa,
  considerando o tempo de ida e volta e reservando margem para paradas
```

```bash
git add -A
git commit -m "feat: descoberta de destinos para onde vamos"
```

---

## Tarefa 13 — Documentação e briefings de skills

Fecha a fundação. Os briefings existem para que invocar uma skill de design
devolva algo específico do Rastro, e não conselho genérico de dashboard.

**Arquivos:**
- Criar: `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/CONTRIBUTING.md`
- Criar: `docs/skills/README.md`, `docs/skills/impeccable.md`,
  `docs/skills/frontend-design.md`, `docs/skills/web-design-guidelines.md`
- Modificar: `CHANGELOG.md`

- [ ] **Passo 1: Escrever `docs/ARCHITECTURE.md`**

Deve conter: o diagrama de camadas (`domain` → `lib/data` e `lib/map` →
`components` → `app`) com a regra de import de cada uma e a razão de a regra
existir; a explicação do route group `(app)` e do mapa persistente, remetendo ao
ADR 0002; o fluxo de dados completo de uma requisição do Explore — página de
servidor busca no repositório, passa para `ExploreView`, que lê filtros da URL,
aplica `filterPlaces` e entrega a lista ao `PlacesLayer`, que converte em GeoJSON
e chama `setData`; o padrão "componente sem DOM" usado por `PlacesLayer`; a
tabela de contextos existentes (`MapProvider`, `VisiblePlacesProvider`) com quem
escreve e quem lê cada um; e o índice de todos os ADRs com uma linha cada.

- [ ] **Passo 2: Escrever `docs/ROADMAP.md`**

Organize em três blocos, sem prazos.

**Próximo** — conectar o Supabase substituindo apenas `src/lib/data/index.ts`;
autenticação e substituição do `DEV_USER_ID`; ações de escrita do painel
(favoritar, marcar visita); registro de viagens com paradas; upload de fotos no
Supabase Storage.

**Depois** — tela de Memórias com timeline por ano e mês; página de viagem
concluída no formato de diário, com mapa da rota e galeria; estatísticas
(quilometragem, municípios, maior viagem, km por moto, regiões exploradas);
navegação mobile própria, com bottom sheet no lugar do painel lateral; leitura de
EXIF para posicionar fotos no mapa.

**Talvez** — glyphs próprios para os labels do mapa, hoje impossível com os
glyphs do MapTiler; migração para PostGIS conforme o gatilho do ADR 0004;
importação de lugares de fontes externas; múltiplas motos com estatísticas
comparadas.

**Fora de escopo declarado** — rede social, feed público, scraping, integração
com Instagram, recomendação por IA, tracking GPS em tempo real, app nativo,
gamificação.

- [ ] **Passo 3: Escrever `docs/CONTRIBUTING.md`**

Deve conter: a regra primordial do CHANGELOG, com o fluxo dos cinco passos
copiado do `CLAUDE.md`; o formato de entrada e as categorias em PT-BR; a
definição de concluído; a convenção de mensagem de commit (`feat:`, `fix:`,
`chore:`, `docs:`, `refactor:` em português, imperativo, minúsculas); quando
escrever um ADR e o modelo de quatro seções (Contexto, Decisão, Consequências,
Alternativas recusadas); e a regra de justificar dependência antes de instalar.

- [ ] **Passo 4: Escrever `docs/skills/README.md`**

Explique que os arquivos desta pasta são **briefings de contexto**, não
documentação de produto: são o texto que se referencia ao invocar uma skill de
design, para que ela responda sobre o Rastro e não sobre um SaaS genérico.

Inclua a tabela de quando usar cada uma:

| Situação | Skill | Briefing |
|---|---|---|
| Revisar ou elevar uma tela existente, hierarquia, densidade, microinterações | `/impeccable` | `docs/skills/impeccable.md` |
| Criar uma tela ou componente novo, definir direção estética | `/frontend-design` | `docs/skills/frontend-design.md` |
| Auditar acessibilidade, foco, contraste, semântica | `/web-design-guidelines` | `docs/skills/web-design-guidelines.md` |

Feche com a instrução de uso: colar o conteúdo do briefing correspondente junto
com o pedido, ou pedir explicitamente que a skill leia o arquivo antes de
responder.

- [ ] **Passo 5: Escrever `docs/skills/impeccable.md`**

Estruture em seções, todas específicas do Rastro:

**O produto em uma frase** — o mapa é a memória visual da vida do motociclista; o
Google Maps responde "como chego lá?", o Rastro responde "para onde eu vou?".

**Restrições invioláveis** — o mapa é estrutura, nunca conteúdo de card; raio
máximo de 2px; nenhuma sombra difusa, separação por hairlines de 1px; nenhum card
contendo conteúdo primário; todo dado numérico em `.instrument-value`; âmbar
`#f0a32b` é exclusivo da interface e dos pins, nunca da base do mapa; blur apenas
por legibilidade sobre o mapa.

**Vocabulário visual** — navegação, cartas topográficas, instrumentos de viagem,
expedição, GPS outdoor, interfaces automotivas premium. A statusbar inferior em
mono é o elemento âncora dessa leitura.

**O que já está decidido e não deve ser reaberto** — os três canais visuais do
pin (ADR 0005); o painel contextual lateral em vez de modal central; o mapa
persistente no layout (ADR 0002); a paleta e os tokens de
`docs/DESIGN-SYSTEM.md`.

**O que ainda está aberto a crítica** — densidade e hierarquia dentro do painel
do lugar; a trilha de filtros à esquerda, que hoje é uma coluna fixa e poderia
ser colapsável; o tratamento do estado vazio da descoberta; a ausência de
transição ao abrir e fechar painéis; o comportamento em telas menores, já que
mobile ainda não tem navegação própria.

**Anti-padrões que já rejeitamos** — a lista completa do `CLAUDE.md`, com a
observação de que sugerir qualquer um deles significa que o briefing não foi
lido.

- [ ] **Passo 6: Escrever `docs/skills/frontend-design.md`**

Deve conter: os tokens com valores exatos, copiados de `docs/DESIGN-SYSTEM.md`;
as duas famílias tipográficas e a regra de mono para dado numérico; a estrutura
do shell em três faixas e o padrão de overlay com `pointer-events`; a API dos
primitivos existentes, com a instrução de reutilizá-los antes de criar
componentes novos; a regra de camadas, deixando claro que componente visual não
calcula nada; e a lista de padrões proibidos.

Feche com uma seção **Antes de propor um componente novo**, pedindo verificação
de que nenhum primitivo existente resolve, de que o componente não carrega lógica
de negócio e de que ele funciona sobre um fundo de mapa em movimento.

- [ ] **Passo 7: Escrever `docs/skills/web-design-guidelines.md`**

Deve conter: as garantias de acessibilidade já assumidas — `:focus-visible`
global âmbar com offset, `aria-pressed` nos chips, checkbox nativo no Toggle,
`aria-current` na navegação, `aria-label` no botão de fechar, botão real em vez
de `div` clicável; e os pontos que precisam de verificação recorrente.

Liste explicitamente os riscos conhecidos desta interface, que uma auditoria deve
sempre checar: contraste do texto `--color-ink-faint` sobre `--color-base`, que é
o par mais frágil da paleta; legibilidade dos rótulos sobre o mapa, cujo fundo
varia com o conteúdo do tile; tamanho de alvo dos pins em toque, hoje pensados
para mouse; ausência de anúncio para leitores de tela quando a contagem de
resultados muda após filtrar; e o fato de que os pins do mapa são desenhados em
WebGL e portanto **não** são alcançáveis por teclado nem expostos à árvore de
acessibilidade — uma lista textual alternativa dos lugares visíveis é a mitigação
natural e ainda não existe.

- [ ] **Passo 8: Atualizar o CHANGELOG e commitar**

```bash
npm run lint && npm run typecheck && npm test
```

CHANGELOG, sob `### Adicionado`:

```markdown
- Documentação de arquitetura, roadmap e contribuição
- Briefings de contexto do projeto para as skills de design, evitando respostas
  genéricas ao trabalhar na interface
```

```bash
git add -A
git commit -m "docs: arquitetura, roadmap e briefings de skills"
```

---

## Verificação final da entrega

Depois da Tarefa 13, rode a checagem completa antes de declarar a fundação
pronta:

- [ ] `npm run lint` — sem warnings
- [ ] `npm run typecheck` — limpo
- [ ] `npm test` — todas as suítes verdes
- [ ] `npm run build` — build de produção conclui
- [ ] `git log --oneline` — todo commit tem entrada correspondente no
      `CHANGELOG.md`
- [ ] Busca por `any`, `@ts-ignore` e `console.log` em `src/` não retorna nada
- [ ] Navegar Explorar → Descobrir → Viagens → Memórias → Explorar preserva
      posição e zoom do mapa
- [ ] Uma URL com filtros e lugar selecionado, colada numa aba nova, reproduz o
      estado exato
- [ ] Sem `NEXT_PUBLIC_MAPTILER_KEY`, a aplicação sobe e explica o que fazer

---

## Autorrevisão do plano

Executada após a escrita, contra o spec de 2026-07-27.

**Cobertura do spec.** Todas as seções têm tarefa correspondente: produto e
princípio (Tarefa 13, `ROADMAP.md` e briefings); stack (1); modelo de dados
(3, 5, 6); camada de dados (5); estratégia de mapa (8, 9); direção visual (2);
descoberta (4, 12); dados de desenvolvimento (5); estrutura de diretórios
(distribuída); governança (1 a 13, via restrições globais); escopo da entrega
(7 a 12).

**Lacunas corrigidas durante a revisão.**

1. *Responsividade (spec §7.5) não tinha tarefa.* O spec promete que
   `PlacePanel` seja agnóstico de container. Verificado: o componente recebe a
   moldura de `OverlayPanel` e não posiciona a si mesmo — trocar por um bottom
   sheet no futuro não exige reescrever o conteúdo. Nenhuma tarefa nova é
   necessária, mas a Tarefa 13 registra explicitamente em `ROADMAP.md` que a
   navegação mobile própria continua pendente, para que a promessa não se perca.
2. *Formatação de datas não existia no spec.* O painel precisa exibir a data da
   última visita e não havia nenhum utilitário para isso. Acrescentado
   `src/domain/dates.ts` na Tarefa 10, com teste para a armadilha de fuso
   horário.
3. *A statusbar precisava da contagem, mas a contagem nasce na página.* Isso não
   estava resolvido. Acrescentado `VisiblePlacesProvider` na Tarefa 11, com a
   nota de que a Tarefa 7 deliberadamente não o cria antes de existir dado.

**Consistência de tipos.** Verificados os nomes usados entre tarefas:
`ExplorePlace` (3 → 5, 9, 10, 11, 12); `filterPlaces(places, filters, origin)`
(4 → 11); `findDestinations(places, query)` (4 → 12);
`buildPlacesGeoJson(places)` (9 → interno); `useMapInstance()` (8 → 9);
`useSelectedPlace()` (9 → 10, 12); `PLACE_LAYERS` (9 → interno);
`DEFAULT_ORIGIN` (5 → 10, 11, 12); `formatVisitDate` (10 → 10).
O campo da unidade federativa é `stateCode` em todos os pontos, escolhido para
não colidir com o conceito de estado de visita.

**Divergências deliberadas em relação ao spec, todas registradas no plano.**

| # | Spec dizia | Plano faz | Onde |
|---|---|---|---|
| 1 | Labels do mapa em Geist Mono | Noto Sans em caixa alta com tracking largo | Tarefa 8, nota de abertura |
| 2 | Favorito como anel âmbar | Anel osso `#e8edea` | Tarefa 9, ADR 0005 |
| 3 | "Raio" sem qualificar | "Raio em linha reta", distinto da estimativa rodoviária da descoberta | Tarefa 4, quadro das duas distâncias |

A primeira é uma limitação técnica do provedor de glyphs. As outras duas são
correções de legibilidade e honestidade de rótulo. Nenhuma altera arquitetura.
