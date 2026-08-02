# Home: mapa, pergunta e vitrine — Plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A rota `/` passa a ser o mapa, a pergunta "para onde vamos?" em destaque e um carrossel de lugares que faltam conhecer no canto inferior direito.

**Architecture:** As imagens dos cartões são resolvidas no servidor (`page.tsx`) e entregues ao cliente como uma `Promise` desembrulhada com `use()` dentro de um limite de `Suspense` — mapa e CTA pintam na hora, a vitrine entra quando o Commons responde. A escolha do que entra no carrossel e de qual imagem usar é função pura em `src/domain/carousel.ts`. O carrossel anda acoplado ao passeio de câmera que já existe.

**Tech Stack:** Next 16.2.12 (App Router), React 19.2.4, TypeScript strict, Tailwind v4, MapLibre GL, Vitest.

## Global Constraints

- **CHANGELOG obrigatório.** Todo commit exige entrada em `CHANGELOG.md` sob `## [Não lançado]`. Sem exceção.
- **`npm run lint` e `npm run typecheck` limpos** antes de cada commit. `lint` roda com `--max-warnings=0`.
- **Nenhum `any` novo, nenhum `@ts-ignore` novo, nenhum `console.log`.**
- **Teste só de função pura**, em `src/domain/`. Nenhum teste de componente — é regra do `CLAUDE.md`, seção "Testes — não testar tudo".
- **Camadas:** `src/domain/` não importa nada do projeto além de `domain` — nem `lib`, nem React. `src/components/` não calcula regra de negócio; pode chamar função pura do domínio.
- **Proibido:** gradiente decorativo, glassmorphism decorativo, ícone decorativo, toast, tooltip só de hover, skeleton, modal, **número sem régua**.
- **Âmbar cheio (`bg-accent-fill`) significa "quero conhecer" no vocabulário dos pins.** Em botão de navegação o âmbar é contorno e texto, nunca preenchimento.
- **Nenhuma dependência nova.**
- **Textos de interface em PT-BR; código em inglês.**
- **Alvo de toque mínimo 44px** (`h-11`). Corpo mínimo 17px (`text-body`).
- **O mapa não lê variável CSS.** Números de padding de câmera são espelhados à mão em `ExploreView`.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
|---|---|
| `src/domain/carousel.ts` *(criar)* | Quem entra no carrossel e qual imagem cada cartão usa. Puro. |
| `src/domain/carousel.test.ts` *(criar)* | Testes das três funções acima. |
| `src/lib/photos/carousel.ts` *(criar)* | Orquestra: busca no Commons os lugares sem capa e monta os cartões. |
| `src/lib/photos/commons.ts` *(modificar)* | Declara cache no `fetch`. |
| `src/lib/photos/index.ts` *(modificar)* | Exporta `loadCarouselCards`. |
| `src/components/explore/PlaceCarousel.tsx` *(criar)* | Apresentação do carrossel. Um cartão por vez, setas e pontos. |
| `src/components/explore/PlacesToggle.tsx` *(criar)* | Cápsula "Lugares" que abre a trilha. |
| `src/components/explore/ExploreView.tsx` *(modificar)* | Costura: trilha fechada por padrão, índice ativo, `CAMERA_PADDING`. |
| `src/components/explore/DiscoveryLauncher.tsx` *(modificar)* | Cresce e recalcula a faixa em que centraliza. |
| `src/components/fuel/FuelToggle.tsx` *(modificar)* | O deslocamento da trilha vira condicional. |
| `src/app/(app)/page.tsx` *(modificar)* | Dispara a resolução dos cartões sem aguardar. |
| `src/app/globals.css` *(modificar)* | Tokens `--carousel-width` e `--carousel-height`. |

---

## Task 1: Domínio do carrossel

**Files:**
- Create: `src/domain/carousel.ts`
- Test: `src/domain/carousel.test.ts`

**Interfaces:**
- Consumes: `ExplorePlace`, `PlaceCategory` de `src/domain/place.ts`.
- Produces: `CandidatePhoto`, `CardImage`, `CarouselCard`, `carouselPlaces()`, `resolveCardImage()`, `toCarouselCard()`.

- [ ] **Step 1: Escrever o teste que falha**

Criar `src/domain/carousel.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  carouselPlaces,
  resolveCardImage,
  toCarouselCard,
  type CandidatePhoto,
} from './carousel'
import type { ExplorePlace } from './place'

function place(overrides: Partial<ExplorePlace> = {}): ExplorePlace {
  return {
    id: 'id-1',
    slug: 'serra-do-rio-do-rastro',
    name: 'Serra do Rio do Rastro',
    description: '',
    latitude: -28.38,
    longitude: -49.53,
    municipality: 'Bom Jardim da Serra',
    stateCode: 'SC',
    category: 'serra',
    tags: [],
    coverImageUrl: null,
    source: 'mock',
    visitStatus: 'nao-visitado',
    isFavorite: false,
    photoCount: 0,
    lastVisitedAt: null,
    visits: [],
    isOwn: false,
    accessSurface: null,
    ...overrides,
  }
}

const COM_GPS: CandidatePhoto = {
  thumbnailUrl: 'https://commons/serra.jpg',
  distanceM: 680,
}

const SEM_GPS: CandidatePhoto = {
  thumbnailUrl: 'https://commons/hospital.jpg',
  distanceM: null,
}

describe('carouselPlaces', () => {
  it('deixa de fora o que já foi visitado', () => {
    const places = [
      place({ slug: 'a', visitStatus: 'nao-visitado' }),
      place({ slug: 'b', visitStatus: 'visitado' }),
      place({ slug: 'c', visitStatus: 'quero-conhecer' }),
    ]

    expect(carouselPlaces(places).map((p) => p.slug)).toEqual(['a', 'c'])
  })

  it('preserva a ordem recebida, que é a ordem do passeio', () => {
    const places = [place({ slug: 'c' }), place({ slug: 'a' }), place({ slug: 'b' })]

    expect(carouselPlaces(places).map((p) => p.slug)).toEqual(['c', 'a', 'b'])
  })

  it('devolve tudo quando ninguém visitou nada', () => {
    const places = [place({ slug: 'a' }), place({ slug: 'b' })]

    expect(carouselPlaces(places)).toHaveLength(2)
  })
})

describe('resolveCardImage', () => {
  it('a capa curada vence qualquer foto de terceiro', () => {
    const image = resolveCardImage(
      place({ coverImageUrl: 'https://rastro/capa.jpg' }),
      [COM_GPS],
    )

    expect(image).toEqual({
      url: 'https://rastro/capa.jpg',
      source: 'capa',
      distanceM: null,
    })
  })

  it('sem capa, aceita a foto do Commons que tem coordenada', () => {
    const image = resolveCardImage(place(), [SEM_GPS, COM_GPS])

    expect(image).toEqual({
      url: 'https://commons/serra.jpg',
      source: 'commons',
      distanceM: 680,
    })
  })

  it('recusa foto casada pelo nome: pode ser de outro ponto do município', () => {
    expect(resolveCardImage(place(), [SEM_GPS])).toBeNull()
  })

  it('sem foto nenhuma, não inventa imagem', () => {
    expect(resolveCardImage(place(), [])).toBeNull()
  })
})

describe('toCarouselCard', () => {
  it('carrega o que o cartão precisa para se desenhar', () => {
    const card = toCarouselCard(place(), [COM_GPS])

    expect(card).toEqual({
      slug: 'serra-do-rio-do-rastro',
      name: 'Serra do Rio do Rastro',
      category: 'serra',
      latitude: -28.38,
      longitude: -49.53,
      image: {
        url: 'https://commons/serra.jpg',
        source: 'commons',
        distanceM: 680,
      },
    })
  })

  it('lugar sem imagem não vira cartão', () => {
    expect(toCarouselCard(place(), [])).toBeNull()
  })
})
```

- [ ] **Step 2: Rodar o teste e confirmar que falha**

Run: `npm test -- carousel`
Expected: FAIL — `Failed to resolve import "./carousel"`.

- [ ] **Step 3: Escrever a implementação**

Criar `src/domain/carousel.ts`:

```ts
import type { ExplorePlace, PlaceCategory } from './place'

/**
 * O mínimo que o domínio precisa saber de uma foto de terceiro.
 *
 * **Não importa `CommonsPhoto`**, e isso é regra de camada, não preferência:
 * `src/domain/` não conhece `src/lib/`. `CommonsPhoto` satisfaz esta forma por
 * estrutura, e o dia em que outra fonte de foto entrar ela satisfaz também.
 */
export interface CandidatePhoto {
  thumbnailUrl: string
  /** Metros até o lugar. `null` significa que a foto não tem coordenada. */
  distanceM: number | null
}

/**
 * De onde veio a imagem do cartão. Muda o que o produto pode afirmar sobre ela.
 *
 * - `capa` — curada por nós. É do lugar, e não precisa de etiqueta.
 * - `commons` — de terceiro, com GPS dentro do raio. A distância é fato e vai
 *   escrita no cartão.
 */
export type CardImageSource = 'capa' | 'commons'

export interface CardImage {
  url: string
  source: CardImageSource
  /** Metros entre a foto e o lugar. Sempre `null` quando a fonte é `capa`. */
  distanceM: number | null
}

/** O que o cartão precisa para se desenhar. Nada além disso. */
export interface CarouselCard {
  slug: string
  name: string
  category: PlaceCategory
  latitude: number
  longitude: number
  image: CardImage
}

/**
 * O que ainda falta conhecer, na ordem recebida.
 *
 * A ordem é a do passeio de câmera, e preservá-la é o que impede mapa e vitrine
 * de discordarem sobre qual lugar está em foco.
 *
 * `quero-conhecer` entra junto com `nao-visitado` de propósito: os dois são
 * lugares onde a pessoa não esteve, e a vitrine responde "para onde eu vou?",
 * não "o que eu marquei?".
 */
export function carouselPlaces(places: ExplorePlace[]): ExplorePlace[] {
  return places.filter((place) => place.visitStatus !== 'visitado')
}

/**
 * A imagem do cartão, em escada. O primeiro degrau que responder vence.
 *
 * **Foto casada pelo nome é recusada**, e é a decisão mais importante daqui.
 * Num painel ela é tolerável porque a etiqueta declara a procedência e a pessoa
 * julga — `PlaceNearbyPhotos` documenta que procurar "Santo Amaro da
 * Imperatriz" devolve o hospital do município junto. Num carrossel de vitrine a
 * foto é o argumento inteiro, e ilustrar a serra com o hospital é afirmar o que
 * não sabemos.
 *
 * O preço está aceito e escrito no spec: com as capas em branco, o carrossel
 * nasce curto.
 */
export function resolveCardImage(
  place: Pick<ExplorePlace, 'coverImageUrl'>,
  photos: CandidatePhoto[],
): CardImage | null {
  if (place.coverImageUrl) {
    return { url: place.coverImageUrl, source: 'capa', distanceM: null }
  }

  for (const photo of photos) {
    // O `continue` narreia `distanceM` para `number` no retorno. Um `.find()`
    // com predicado não narreia, e obrigaria a uma asserção.
    if (photo.distanceM === null) continue
    return {
      url: photo.thumbnailUrl,
      source: 'commons',
      distanceM: photo.distanceM,
    }
  }

  return null
}

/** `null` quando não há imagem: lugar sem foto não vira cartão de vitrine. */
export function toCarouselCard(
  place: ExplorePlace,
  photos: CandidatePhoto[],
): CarouselCard | null {
  const image = resolveCardImage(place, photos)
  if (!image) return null

  return {
    slug: place.slug,
    name: place.name,
    category: place.category,
    latitude: place.latitude,
    longitude: place.longitude,
    image,
  }
}
```

- [ ] **Step 4: Rodar o teste e confirmar que passa**

Run: `npm test -- carousel`
Expected: PASS — 9 casos.

- [ ] **Step 5: Verificar e commitar**

```bash
npm run lint && npm run typecheck
```

Adicionar em `CHANGELOG.md`, sob `## [Não lançado]` → `### Adicionado`:

```markdown
- **A vitrine sabe o que pode mostrar.** Entrou a regra de quais lugares aparecem
  na tela inicial — os que faltam conhecer — e de qual foto ilustra cada um:
  capa nossa quando houver, foto de terceiro só quando ela tiver coordenada. Foto
  achada pelo nome do município fica de fora, porque pode ser de outro lugar
```

```bash
git add src/domain/carousel.ts src/domain/carousel.test.ts CHANGELOG.md
git commit -m "feat(vitrine): a regra de quem aparece e com qual foto"
```

---

## Task 2: Montagem dos cartões no servidor

**Files:**
- Create: `src/lib/photos/carousel.ts`
- Modify: `src/lib/photos/commons.ts` (função `query`, ~linha 103)
- Modify: `src/lib/photos/index.ts`

**Interfaces:**
- Consumes: `carouselPlaces()`, `toCarouselCard()`, `CarouselCard` da Task 1; `getCommonsClient()` de `src/lib/photos/index.ts`.
- Produces: `loadCarouselCards(places: ExplorePlace[]): Promise<CarouselCard[]>`, reexportada por `src/lib/photos/index.ts`.

Sem teste: não é função pura, e a regra do `CLAUDE.md` diz que isso não recebe teste.

- [ ] **Step 1: Declarar cache no fetch do Commons**

Em `src/lib/photos/commons.ts`, achar `async function query` e substituir a chamada de `fetch`:

```ts
async function query(url: URL): Promise<CommonsPage[]> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    // Um dia. A tela inicial passou a pedir foto de uma dúzia de lugares por
    // visita, e sem cache isso é abusar de uma API aberta, gratuita e que ainda
    // pede identificação de quem consulta. Foto do Commons para uma coordenada
    // fixa não muda por hora.
    next: { revalidate: COMMONS_REVALIDATE_S },
    headers: {
      // O Commons pede identificação de quem consulta.
      'Api-User-Agent': 'Rastro/1.0 (projeto pessoal; mapa de viagem)',
    },
  })
  if (!response.ok) return []
  return readPages(await response.json())
}
```

Declarar a constante junto das outras do topo do arquivo (perto de `TIMEOUT_MS`):

```ts
/** Um dia. Ver a justificativa em `query`. */
const COMMONS_REVALIDATE_S = 60 * 60 * 24
```

- [ ] **Step 2: Escrever o montador**

Criar `src/lib/photos/carousel.ts`:

```ts
import {
  carouselPlaces,
  toCarouselCard,
  type CarouselCard,
} from '@/domain/carousel'
import type { ExplorePlace } from '@/domain/place'
import { getCommonsClient } from './index'

/**
 * Os cartões da vitrine, prontos para o cliente.
 *
 * Roda no SERVIDOR, e é o ponto do desenho que evita a cascata: sem isto cada
 * cartão pediria a sua foto do navegador, e a vitrine apareceria em pedaços —
 * com cartões nascendo e sumindo conforme cada resposta chegasse.
 *
 * Quem tem capa curada não vai ao Commons: é ida de rede por nada.
 *
 * `Promise.all` e não sequência. O cliente do Commons nunca lança — falha vira
 * lista vazia, e lista vazia vira lugar fora do carrossel —, então não há
 * rejeição para uma ida derrubar as outras.
 */
export async function loadCarouselCards(
  places: ExplorePlace[],
): Promise<CarouselCard[]> {
  const commons = getCommonsClient()

  const cards = await Promise.all(
    carouselPlaces(places).map(async (place) => {
      if (place.coverImageUrl) return toCarouselCard(place, [])
      const photos = await commons.forPlace(place, place.name)
      return toCarouselCard(place, photos)
    }),
  )

  return cards.filter((card): card is CarouselCard => card !== null)
}
```

- [ ] **Step 3: Exportar**

Em `src/lib/photos/index.ts`, acrescentar ao fim do arquivo:

```ts
export { loadCarouselCards } from './carousel'
export type { CarouselCard } from '@/domain/carousel'
```

- [ ] **Step 4: Verificar**

```bash
npm run lint && npm run typecheck && npm test
```

Expected: tudo limpo, testes da Task 1 continuam verdes.

- [ ] **Step 5: Confirmar que o cache pegou**

Rodar `npm run dev`, abrir `/` duas vezes e observar o terminal. A segunda visita não deve disparar novas idas ao Commons.

**Se o Next ignorar `next: { revalidate }` por causa do `signal`** — é um comportamento que precisa ser conferido, não presumido —, a correção é envolver `forPlace` em `unstable_cache` dentro de `src/lib/photos/carousel.ts`, mantendo `commons.ts` intocado. Não invente uma terceira solução.

- [ ] **Step 6: Commitar**

Entrada em `CHANGELOG.md`, sob `### Alterado`:

```markdown
- **As fotos de terceiros passam a ser guardadas por um dia.** A tela inicial
  pede foto de uma dúzia de lugares por visita; repetir essa consulta a cada
  abertura era abusar de um serviço aberto e gratuito sem ganho nenhum
```

```bash
git add src/lib/photos/ CHANGELOG.md
git commit -m "feat(vitrine): os cartoes sao montados no servidor, com cache"
```

---

## Task 3: O componente do carrossel

**Files:**
- Create: `src/components/explore/PlaceCarousel.tsx`
- Modify: `src/app/globals.css` (bloco de tokens, perto de `--panel-wide`, ~linha 344)

**Interfaces:**
- Consumes: `CarouselCard` de `@/domain/carousel`; `haversineKm`, `formatDistanceKm` de `@/domain/geo`; `estimateRoadKm` de `@/domain/discovery`; `CATEGORY_LABELS` de `@/domain/place`; `useOrigin` de `@/components/layout/origin-context`.
- Produces: `<PlaceCarousel cardsPromise activeSlug onActiveChange onSelect onHover />`.

Sem teste: é componente. A regra do `CLAUDE.md` proíbe.

- [ ] **Step 1: Acrescentar os tokens**

Em `src/app/globals.css`, junto de `--panel-narrow` / `--panel-base` / `--panel-wide`:

```css
    /* Vitrine da tela inicial. A largura vale de 768px para cima, onde ela mora
       no canto; a altura vale abaixo disso, onde ela é uma faixa e o botão
       principal precisa saber de quanto subir para não ficar embaixo dela.
       É o mesmo acordo de `--sheet-height`: um número num lugar só. */
    --carousel-width: 300px;
    --carousel-height: 8.5rem;
```

- [ ] **Step 2: Escrever o componente**

Criar `src/components/explore/PlaceCarousel.tsx`:

```tsx
'use client'

import { use, useEffect, useRef } from 'react'
import type { CarouselCard } from '@/domain/carousel'
import { estimateRoadKm } from '@/domain/discovery'
import { formatDistanceKm, haversineKm } from '@/domain/geo'
import { CATEGORY_LABELS } from '@/domain/place'
import { useOrigin } from '@/components/layout/origin-context'

interface PlaceCarouselProps {
  /** Resolvida no servidor. Desembrulhada com `use()` sob um `Suspense`. */
  cardsPromise: Promise<CarouselCard[]>
  /** O cartão à mostra. Vem do passeio de câmera enquanto ele estiver de pé. */
  activeSlug: string | null
  /** A vitrine pediu para trocar de cartão. */
  onActiveChange: (slug: string) => void
  /** Abrir o lugar: a câmera voa até o pin e o painel abre. */
  onSelect: (slug: string) => void
  /** Acende o anel do pin correspondente. */
  onHover: (slug: string | null) => void
}

/**
 * A vitrine dos lugares que faltam conhecer.
 *
 * **Um cartão por vez, e não uma tira que rola.** A tira precisaria de um
 * ouvinte de rolagem para saber qual cartão está no centro, e esse ouvinte
 * brigaria com o passeio de câmera, que também move o cartão: um empurra, o
 * outro reage, e os dois se realimentam. Um cartão por vez não tem esse laço —
 * o cartão à mostra é sempre uma decisão de alguém, do passeio ou da pessoa.
 *
 * Não decide o que mostrar, não filtra e não ordena: recebe os cartões prontos.
 * A distância é calculada chamando as mesmas funções puras que a lista de
 * lugares usa, e pela mesma razão — os dois podem estar visíveis ao mesmo tempo
 * e não podem discordar sobre o mesmo lugar.
 */
export function PlaceCarousel({
  cardsPromise,
  activeSlug,
  onActiveChange,
  onSelect,
  onHover,
}: PlaceCarouselProps) {
  const cards = use(cardsPromise)
  const { origin } = useOrigin()

  const index = Math.max(
    0,
    cards.findIndex((card) => card.slug === activeSlug),
  )
  const card = cards[index]

  // O primeiro cartão precisa de dono. Sem passeio — movimento reduzido, ou
  // gesto já dado antes de a vitrine chegar — `activeSlug` nasce nulo, e sem
  // isto a seta seguinte partiria de lugar nenhum.
  const announced = useRef<string | null>(null)
  useEffect(() => {
    if (!card || activeSlug !== null) return
    if (announced.current === card.slug) return
    announced.current = card.slug
    onActiveChange(card.slug)
  }, [card, activeSlug, onActiveChange])

  if (!card) return null

  function step(delta: number) {
    const next = cards[(index + delta + cards.length) % cards.length]
    if (next) onActiveChange(next.slug)
  }

  return (
    <section
      aria-label="Lugares para conhecer"
      onMouseEnter={() => onHover(card.slug)}
      onMouseLeave={() => onHover(null)}
      className="chrome-capsule pointer-events-auto absolute z-(--z-map-chrome)
                 inset-x-(--chrome-gap)
                 bottom-[calc(var(--nav-height)+var(--safe-bottom)+var(--attrib-height)+var(--chrome-gap)*2)]
                 flex flex-col overflow-hidden rounded-xl
                 md:inset-x-auto md:right-(--chrome-gap)
                 md:bottom-[calc(var(--status-height)+var(--chrome-gap)*2)]
                 md:w-(--carousel-width)"
    >
      <button
        type="button"
        onClick={() => onSelect(card.slug)}
        onFocus={() => onHover(card.slug)}
        onBlur={() => onHover(null)}
        className="press flex min-w-0 flex-1 items-stretch gap-3 text-left
                   md:flex-col md:gap-0"
      >
        {/*
          Sem `next/image`: a URL vem do Commons e o otimizador do Next geraria
          uma variante nossa de obra de terceiro. É a mesma decisão, pelo mesmo
          motivo, que `PlaceNearbyPhotos` já tomou.
        */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.image.url}
          alt=""
          className="h-(--carousel-height) w-28 shrink-0 object-cover
                     md:h-36 md:w-full"
        />

        <span className="flex min-w-0 flex-1 flex-col justify-center gap-1.5 py-2.5 pr-3 md:px-4 md:py-3">
          <span className="instrument-label truncate">
            {CATEGORY_LABELS[card.category]}
          </span>

          <span className="truncate text-body leading-snug text-ink">
            {card.name}
          </span>

          {/*
            Distância corrigida por estrada, a mesma conta da lista e do painel.
            `~` e régua tracejada porque é conta, não medição. Sem origem no
            perfil a régua é pontilhada e o valor é `—`: o produto diz que não
            sabe, em vez de calcular a partir de lugar nenhum.
          */}
          <span className="flex w-20 flex-col gap-1.75">
            <span className="instrument-value text-small whitespace-nowrap text-ink-muted">
              {origin
                ? `~ ${formatDistanceKm(estimateRoadKm(haversineKm(origin, card)))} km`
                : '—'}
            </span>
            <span
              aria-hidden
              className={
                origin
                  ? 'instrument-rule instrument-rule--estimated w-full min-w-0'
                  : 'instrument-rule instrument-rule--unknown w-full min-w-0'
              }
            />
          </span>
        </span>
      </button>

      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-line px-2">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="Lugar anterior"
          className="press flex h-11 w-11 items-center justify-center rounded-full
                     text-lead text-ink-faint hover:bg-overlay hover:text-ink"
        >
          <span aria-hidden>‹</span>
        </button>

        {/*
          Posição como dado, não como enfeite: mono, e é contagem — régua surda.
          Pontos desenhados um a um viram catorze alvos de 8px que ninguém acerta
          de luva, e é isso que esta linha evita.
        */}
        <span className="instrument-value text-micro text-ink-faint">
          {index + 1}/{cards.length}
        </span>

        <button
          type="button"
          onClick={() => step(1)}
          aria-label="Próximo lugar"
          className="press flex h-11 w-11 items-center justify-center rounded-full
                     text-lead text-ink-faint hover:bg-overlay hover:text-ink"
        >
          <span aria-hidden>›</span>
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Verificar**

```bash
npm run lint && npm run typecheck
```

Expected: limpo. O componente ainda não é renderizado por ninguém — é a Task 5 que o liga.

- [ ] **Step 4: Commitar**

Entrada em `CHANGELOG.md`, sob `### Adicionado`:

```markdown
- **Vitrine de lugares na tela inicial.** Um cartão por vez, com foto, categoria
  e a distância desde a sua origem. Tocar no cartão abre o lugar no mapa
```

```bash
git add src/components/explore/PlaceCarousel.tsx src/app/globals.css CHANGELOG.md
git commit -m "feat(vitrine): o cartao de lugar da tela inicial"
```

---

## Task 4: A trilha fecha e ganha uma porta

**Files:**
- Create: `src/components/explore/PlacesToggle.tsx`
- Modify: `src/components/explore/ExploreView.tsx`
- Modify: `src/components/fuel/FuelToggle.tsx`

**Interfaces:**
- Consumes: nada de tasks anteriores.
- Produces: `<PlacesToggle open count onToggle />`; `FuelToggle` passa a receber `shifted: boolean`.

- [ ] **Step 1: Escrever a cápsula**

Criar `src/components/explore/PlacesToggle.tsx`:

```tsx
'use client'

import { cn } from '@/lib/utils/cn'

interface PlacesToggleProps {
  open: boolean
  /** Quantos lugares o recorte tem agora. */
  count: number
  onToggle: () => void
}

/**
 * A porta da trilha de lugares.
 *
 * A trilha deixou de nascer aberta para o mapa poder ser o que o ADR 0010 diz
 * que ele é — estrutura, e não o buraco entre painéis. Mas ela é o único
 * caminho de TECLADO até um lugar, e a única leitura de "o que está no recorte"
 * quando os pins se sobrepõem em zoom baixo. Escondê-la sem lhe dar uma porta
 * alcançável seria trocar acessibilidade por limpeza visual.
 *
 * É a mesma cápsula da chave de postos, no mesmo canto e do mesmo material — as
 * duas são controles de mapa, e duas peças de cromo com a mesma função não
 * podem ter materiais diferentes.
 */
export function PlacesToggle({ open, count, onToggle }: PlacesToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={open}
      className={cn(
        'chrome-capsule chrome-press press pointer-events-auto absolute',
        'top-[calc(var(--bar-height)+var(--chrome-gap)*2)]',
        'left-(--chrome-gap) z-(--z-bar)',
        'flex h-11 items-center gap-2.5 rounded-full px-4 whitespace-nowrap',
        'text-small font-medium',
        open ? 'text-ink' : 'text-ink-muted hover:text-ink',
      )}
    >
      Lugares
      {/* Contagem é dado: mono, como o mostrador e a lista. */}
      <span
        key={count}
        className="value-changed instrument-value text-micro text-ink-faint"
        data-motion="signal"
      >
        {count}
      </span>
    </button>
  )
}
```

- [ ] **Step 2: Tornar condicional o deslocamento da chave de postos**

Em `src/components/fuel/FuelToggle.tsx`, acrescentar a prop e trocar a classe fixa.

Na interface:

```ts
interface FuelToggleProps {
  active: boolean
  /** Quantos postos a última busca trouxe. `null` enquanto não há resposta. */
  count: number | null
  busy: boolean
  /** A trilha da esquerda está aberta e ocupa o canto. */
  shifted: boolean
  onToggle: () => void
}
```

Na assinatura: `export function FuelToggle({ active, count, busy, shifted, onToggle }: FuelToggleProps) {`

E no `cn(...)`, trocar a linha

```ts
        'md:left-[calc(var(--panel-base)+var(--chrome-gap)*2)]',
```

por

```ts
        // A trilha deixou de nascer aberta: sem ela no caminho, a chave encosta
        // na borda como qualquer outro controle de mapa. O deslocamento existe
        // só enquanto há trilha para desviar.
        shifted
          ? 'md:left-[calc(var(--panel-base)+var(--chrome-gap)*2)]'
          : 'md:left-(--chrome-gap)',
```

Ajustar também o cabeçalho do componente, que hoje afirma "Fica no alto à esquerda da área de mapa — depois da trilha, e não sobre ela": trocar por "depois da trilha quando ela estiver aberta, e encostada na borda quando não estiver."

- [ ] **Step 3: Fechar a trilha por padrão em `ExploreView`**

Em `src/components/explore/ExploreView.tsx`:

Importar o novo componente junto dos outros de `./`:

```ts
import { PlacesToggle } from './PlacesToggle'
```

Acrescentar o estado, junto de `hoveredSlug`:

```ts
  // A trilha não nasce aberta. Estado local e não na URL: é preferência de
  // momento, não recorte compartilhável — o recorte já vive na URL pelo ADR
  // 0006, e um `?lista=1` junto dele faria um link compartilhado carregar a
  // gaveta de quem o mandou.
  const [railOpen, setRailOpen] = useState(false)
```

Passar `shifted` para a chave de postos:

```tsx
      <FuelToggle
        active={fuel.active}
        count={fuel.status === 'pronto' ? fuel.stations.length : null}
        busy={fuel.status === 'buscando'}
        shifted={railOpen}
        onToggle={toggleFuel}
      />
```

Acrescentar a cápsula logo depois do `DiscoveryLauncher`, e envolver a trilha:

```tsx
      {/* Depois do CTA e antes da chave de postos: a trilha é o caminho de
          teclado até um lugar, e a chave é refinamento. */}
      <PlacesToggle
        open={railOpen}
        count={visible.length}
        onToggle={() => setRailOpen((open) => !open)}
      />

      {railOpen ? (
        <FilterRail
          filters={filters}
          setFilters={setFilters}
          reset={reset}
          isDefault={isDefault}
          visible={visible}
          totalCount={places.length}
          selectedSlug={slug}
          onSelectPlace={select}
          onHoverPlace={setHoveredSlug}
          relaxation={relaxation}
          hasOrigin={origin !== null}
        />
      ) : null}
```

Mover o bloco `<FuelToggle .../>` para DEPOIS de `<PlacesToggle .../>` na ordem do JSX, para a tabulação alcançar "Lugares" antes de "Postos".

- [ ] **Step 4: Refazer `CAMERA_PADDING`**

No mesmo arquivo, substituir a constante e o comentário:

```ts
/**
 * Espaço tomado pelo cromo desta rota. Precisa bater com `--panel-wide`,
 * `--carousel-width`, `--bar-height`, `--status-height` e `--chrome-gap` de
 * `globals.css`: a câmera do MapLibre roda em JavaScript e não lê variável CSS,
 * então os números são espelhados à mão. Divergir faz o pin selecionado terminar
 * embaixo de um painel.
 *
 * **A esquerda deixou de descontar a trilha.** Ela não nasce mais aberta, e
 * reservar 380px de um painel fechado empurrava todo enquadramento para a
 * direita do centro real — sem erro, sem aviso, e visível só como "o mapa está
 * torto".
 *
 * A direita continua reservada com o painel fechado, e é deliberado: um
 * enquadramento que muda quando um painel abre chama mais atenção para o próprio
 * movimento do que para o lugar.
 *
 * Constante de módulo porque um literal novo a cada render remontaria o efeito
 * de câmera.
 */
const CAMERA_PADDING: PaddingOptions = {
  top: 56 + 24,
  right: 420 + 24,
  bottom: 36 + 24,
  left: 24,
}
```

- [ ] **Step 5: Verificar**

```bash
npm run lint && npm run typecheck && npm test
```

- [ ] **Step 6: Conferir no navegador**

`npm run dev`, abrir `/`:

1. A trilha não aparece. A cápsula "Lugares" está no alto à esquerda, encostada na borda, com "Postos" ao lado.
2. Clicar em "Lugares" abre a trilha; a chave "Postos" desloca para a direita dela.
3. **`Tab` a partir do topo alcança "Lugares" antes de "Postos".**
4. Selecionar um lugar centraliza o pin na área visível — não deslocado à direita.

- [ ] **Step 7: Commitar**

Entrada em `CHANGELOG.md`, sob `### Alterado`:

```markdown
- **A tela inicial abre no mapa.** A trilha de busca, lista e filtros deixou de
  ocupar a lateral por padrão e passou a abrir pelo botão "Lugares", no alto à
  esquerda. O enquadramento da câmera foi refeito junto: ele reservava espaço
  para um painel que não está mais lá, e deixava o lugar selecionado fora do
  centro
```

```bash
git add src/components/explore/ExploreView.tsx src/components/explore/PlacesToggle.tsx src/components/fuel/FuelToggle.tsx CHANGELOG.md
git commit -m "feat(home): o mapa abre inteiro, a trilha abre sob demanda"
```

---

## Task 5: Ligar o carrossel ao passeio

**Files:**
- Modify: `src/app/(app)/page.tsx`
- Modify: `src/components/explore/ExploreView.tsx`

**Interfaces:**
- Consumes: `loadCarouselCards` (Task 2), `<PlaceCarousel>` (Task 3), `railOpen` (Task 4).
- Produces: `ExploreView` passa a receber `cardsPromise: Promise<CarouselCard[]>`.

- [ ] **Step 1: Disparar a resolução na página, sem aguardar**

Substituir `src/app/(app)/page.tsx` inteiro:

```tsx
import { getPlaceRepository } from '@/lib/data'
import { loadCarouselCards } from '@/lib/photos'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { DataFallback } from '@/components/layout/DataFallback'
import { ExploreView } from '@/components/explore/ExploreView'

export default async function ExplorePage() {
  if (!isSupabaseConfigured()) return <DataFallback />
  const repository = await getPlaceRepository()
  const places = await repository.listExplorePlaces()

  // **Sem `await`, de propósito.** A promessa atravessa para o cliente e é
  // desembrulhada lá dentro de um `Suspense`: o mapa e a pergunta pintam na
  // hora, e a vitrine entra quando o Commons responder. Aguardar aqui faria
  // uma API de terceiro decidir quando a tela inicial aparece.
  const cardsPromise = loadCarouselCards(places)

  return <ExploreView places={places} cardsPromise={cardsPromise} />
}
```

- [ ] **Step 2: Costurar em `ExploreView`**

Importar:

```ts
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import type { CarouselCard } from '@/domain/carousel'
import { PlaceCarousel } from './PlaceCarousel'
```

(`Suspense` já está importado no arquivo — não duplicar.)

Estender as props:

```ts
interface ExploreViewProps {
  places: ExplorePlace[]
  /** Resolvida no servidor, desembrulhada no carrossel. Ver `page.tsx`. */
  cardsPromise: Promise<CarouselCard[]>
}
```

E repassar em ambos os componentes do arquivo:

```tsx
function ExploreContent({ places, cardsPromise }: ExploreViewProps) {
```

```tsx
export function ExploreView({ places, cardsPromise }: ExploreViewProps) {
  return (
    <Suspense fallback={null}>
      <ExploreContent places={places} cardsPromise={cardsPromise} />
    </Suspense>
  )
}
```

Acrescentar o estado do cartão à mostra, junto de `hoveredSlug`:

```ts
  // Qual cartão a vitrine mostra. Separado de `hoveredSlug` porque os dois
  // têm tempos de vida diferentes: o anel do pin apaga quando o passeio morre,
  // e o cartão precisa continuar onde parou.
  const [carouselSlug, setCarouselSlug] = useState<string | null>(null)
```

Substituir o `onFocus={setHoveredSlug}` do `ExploreTour` por um handler que alimenta os dois:

```tsx
      <ExploreTour
        places={places}
        active={slug === null}
        cameraPadding={CAMERA_PADDING}
        onFocus={handleTourFocus}
      />
```

com o handler declarado antes do `return`:

```ts
  /*
   * A parada do passeio alimenta duas coisas, e elas não morrem juntas.
   *
   * O anel do pin segue o passeio e apaga com ele — é realce, e realce sem
   * causa é ruído. O cartão da vitrine fica onde estava: o passeio terminou
   * porque a pessoa tocou no mapa, não porque perdeu o interesse no lugar que
   * estava na tela.
   */
  const handleTourFocus = useCallback((focused: string | null) => {
    setHoveredSlug(focused)
    if (focused !== null) setCarouselSlug(focused)
  }, [])
```

Renderizar a vitrine, logo depois do `DiscoveryLauncher`:

```tsx
      {/*
        Some com qualquer painel da direita aberto. Os três moram no mesmo
        canto, e é a mesma regra que já vale entre o painel do lugar e o dos
        postos: um por vez. Fora isso a vitrine perdeu a função — a escolha já
        foi feita.
      */}
      {!panelPlace && !fuel.active ? (
        <Suspense fallback={null}>
          <PlaceCarousel
            cardsPromise={cardsPromise}
            activeSlug={carouselSlug}
            onActiveChange={setCarouselSlug}
            onSelect={select}
            onHover={setHoveredSlug}
          />
        </Suspense>
      ) : null}
```

- [ ] **Step 3: Verificar**

```bash
npm run lint && npm run typecheck && npm test
```

- [ ] **Step 4: Conferir no navegador**

`npm run dev`, abrir `/`:

1. O mapa e o botão aparecem imediatamente; a vitrine entra pouco depois.
2. Enquanto o passeio roda, o cartão troca junto com a câmera e o pin correspondente fica com o anel aceso.
3. Ao primeiro gesto o passeio para e o cartão **fica onde estava**.
4. `‹` e `›` trocam o cartão e movem o anel do pin.
5. Clicar no cartão voa até o lugar e abre o painel; **a vitrine some**.
6. Fechar o painel devolve a vitrine.
7. Ligar "Postos" também esconde a vitrine.

- [ ] **Step 5: Commitar**

Entrada em `CHANGELOG.md`, sob `### Adicionado`:

```markdown
- **A vitrine anda junto com o mapa.** Enquanto a câmera passeia pelos lugares,
  o cartão mostra o lugar sobrevoado. No primeiro toque o passeio para e o
  cartão fica onde estava, com setas para seguir na mão
```

```bash
git add "src/app/(app)/page.tsx" src/components/explore/ExploreView.tsx CHANGELOG.md
git commit -m "feat(home): a vitrine e o passeio contam a mesma historia"
```

---

## Task 6: O botão em destaque

**Files:**
- Modify: `src/components/explore/DiscoveryLauncher.tsx`

**Interfaces:**
- Consumes: `--carousel-width` e `--carousel-height` (Task 3).
- Produces: nada.

- [ ] **Step 1: Refazer o posicionamento e o tamanho**

Em `src/components/explore/DiscoveryLauncher.tsx`, substituir o `className` do `<Link>`:

```tsx
      className="chrome-capsule chrome-press press pointer-events-auto absolute
                 bottom-[calc(var(--nav-height)+var(--safe-bottom)+var(--attrib-height)+var(--carousel-height)+var(--chrome-gap)*3)]
                 left-1/2 flex -translate-x-1/2 items-center gap-4 rounded-xl
                 border-accent px-6 py-4 whitespace-nowrap
                 hover:border-accent-strong hover:bg-accent/10
                 md:bottom-[calc(var(--status-height)+var(--chrome-gap)*2)]
                 md:left-(--chrome-gap)
                 md:right-[calc(var(--carousel-width)+var(--chrome-gap)*2)]
                 md:mx-auto md:w-fit md:translate-x-0
                 md:gap-7 md:px-10 md:py-6"
```

E o tamanho da pergunta, no primeiro `<span>` interno:

```tsx
        <span
          className="text-body font-bold tracking-widest text-accent uppercase
                     md:text-title"
        >
          Para onde vamos hoje?
        </span>
```

- [ ] **Step 2: Atualizar o cabeçalho do componente**

As três explicações de posicionamento no comentário do topo estão desatualizadas — falam de folha de filtros e de painel de lugar. Substituir os parágrafos que tratam de posição por:

```
 * Abaixo de 768px o botão sobe o suficiente para ficar acima da vitrine, cuja
 * altura vem de `--carousel-height`. Antes ele subia acima da folha de filtros,
 * que não abre mais por padrão — `--sheet-height` saiu da conta junto.
 *
 * A partir de 768px ele centraliza **na faixa de mapa que sobra à esquerda da
 * vitrine**, e não na viewport.
 *
 * O lado esquerdo deixou de descontar a trilha, que não nasce mais aberta. O
 * direito desconta a vitrine, e é a mesma disciplina de antes: quando o botão
 * cresceu ignorando o painel da direita, 115px dele terminavam embaixo do
 * painel de lugar, e a pergunta central do produto aparecia cortada no meio.
 *
 * A faixa é reservada mesmo com a vitrine escondida. É deliberado: um CTA que
 * muda de posição quando um painel abre chama mais atenção para o próprio
 * movimento do que para o destino.
```

- [ ] **Step 3: Verificar**

```bash
npm run lint && npm run typecheck
```

- [ ] **Step 4: Conferir no navegador**

Medir em 1440px e em 390px:

1. Em 1440px o botão está centrado na faixa à esquerda da vitrine, e **nenhuma parte dele fica embaixo dela**.
2. Em 390px o botão está acima da vitrine e abaixo dela está a navegação — nada sobreposto.
3. Com o painel de lugar aberto o botão **não muda de lugar**.

- [ ] **Step 5: Commitar**

Entrada em `CHANGELOG.md`, sob `### Alterado`:

```markdown
- **"Para onde vamos hoje?" virou a peça principal da tela inicial.** Cresceu e
  passou a dividir a tela com o mapa e a vitrine, em vez de disputar atenção com
  a trilha de filtros
```

```bash
git add src/components/explore/DiscoveryLauncher.tsx CHANGELOG.md
git commit -m "feat(home): a pergunta central em destaque"
```

---

## Task 7: Fechamento

**Files:** nenhum de código.

- [ ] **Step 1: Suíte inteira**

```bash
npm run lint && npm run typecheck && npm test
```

Expected: três limpos. Colar a saída real no relatório.

- [ ] **Step 2: Conferir a definição de concluído do spec**

- [ ] Tabular a partir do topo alcança "Lugares" antes de "Postos"
- [ ] Nenhum número no cartão sem régua — distância tracejada com `~`, ou pontilhada com `—` sem origem; posição `n/total` em mono
- [ ] `CAMERA_PADDING` refeito e o pin selecionado centrado na área visível
- [ ] Carrossel oculto com o painel do lugar aberto
- [ ] Testes só em `src/domain/carousel.ts` — nenhum teste de componente

- [ ] **Step 3: Fumaça**

`npm run smoke` depende de `.env.local` com Supabase, MapTiler e `NEXT_PUBLIC_RASTRO_E2E`, e não entra na definição de concluído (ADR 0022). **Este trabalho mexe no mapa e na entrada da rota `/`, que é exatamente o caso em que o ADR manda rodar.** Rodar se o ambiente permitir; se não permitir, dizer isso explicitamente no relatório em vez de omitir.

**Nenhum caso novo de fumaça neste trabalho.** A regra do ADR 0022 é que um caso só entra depois de ter falhado na presença do defeito que existe para pegar — não há defeito real aqui, há funcionalidade nova.
