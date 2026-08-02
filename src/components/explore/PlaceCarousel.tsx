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
 * brigaria com o passeio de câmera, que também troca o cartão: um empurra, o
 * outro reage, e os dois se realimentam. Um cartão por vez não tem esse laço —
 * o cartão à mostra é sempre decisão de alguém, do passeio ou da pessoa.
 *
 * Não decide o que mostrar, não filtra e não ordena: recebe os cartões prontos.
 * A distância sai das mesmas funções puras que a lista de lugares chama, e pela
 * mesma razão — as duas podem estar visíveis ao mesmo tempo e não podem
 * discordar sobre o mesmo lugar.
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

  const found = cards.findIndex((card) => card.slug === activeSlug)
  const index = found === -1 ? 0 : found
  const card = cards[index]

  /*
   * O primeiro cartão precisa de dono.
   *
   * Sem passeio — movimento reduzido, ou gesto já dado antes de a vitrine
   * chegar — `activeSlug` nasce nulo, e sem isto a seta seguinte partiria de
   * lugar nenhum. O `ref` é o que impede o efeito de reavisar o mesmo slug
   * quando o pai devolve o estado num render seguinte.
   */
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
                 inset-x-(--chrome-gap) h-(--carousel-height)
                 bottom-[calc(var(--nav-height)+var(--safe-bottom)+var(--attrib-height)+var(--chrome-gap)*2)]
                 flex flex-col overflow-hidden rounded-xl
                 md:inset-x-auto md:right-(--chrome-gap) md:h-auto
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
        {/* No celular a foto ocupa a altura que a faixa deixar — a faixa é que
            fixa o total, para o botão principal ter um número só de que
            desviar. A partir de 768px a faixa cresce com o conteúdo e a foto
            passa a ter altura própria. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.image.url}
          alt=""
          className="h-full w-28 shrink-0 object-cover md:h-36 md:w-full"
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
            sabe, em vez de medir a partir de lugar nenhum.
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
          A posição é DADO, e por isso é mono — a mesma regra do mostrador e da
          lista. É contagem, então a régua seria surda e não diria nada que o
          par de números já não diga; pontos desenhados um a um viram catorze
          alvos de 8px que ninguém acerta de luva.
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
