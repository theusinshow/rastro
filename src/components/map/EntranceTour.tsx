'use client'

import { useEffect, useState } from 'react'
import type { PaddingOptions } from 'maplibre-gl'
import type { ShowcasePlace } from '@/lib/data/showcase'
import { CATEGORY_LABELS } from '@/domain/place'
import { markArrival } from '@/lib/map/arrival'
import { runTour, showStopImmediately } from '@/lib/map/tour'
import { useReducedMotion } from '@/lib/motion/use-reduced-motion'
import { useMapInstance } from './map-context'

/** Largura do painel da entrada (`md:w-104` = 26rem), para o lugar não ficar atrás dele. */
const PANEL_PADDING: PaddingOptions = { left: 416, top: 0, right: 0, bottom: 0 }

/**
 * O passeio da tela de entrada, e a legenda de quem está em foco.
 *
 * Dirige a câmera e desenha a faixa do lugar no mesmo componente porque os dois
 * compartilham um estado que não interessa a mais ninguém: qual parada está na
 * tela. Separá-los exigiria um contexto para um dado com um consumidor só.
 *
 * A faixa fica ABAIXO dos botões no painel, e é deliberado: um bloco que troca
 * de conteúdo sozinho chama atenção por natureza, e a decisão registrada é que o
 * mapa não compete com o único controle da tela. O passeio dá vontade de entrar;
 * quem manda entrar continua sendo o botão.
 */
export function EntranceTour({ places }: { places: ShowcasePlace[] }) {
  const map = useMapInstance()
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    if (!map || places.length === 0) return

    const first = places[0]
    if (!first) return

    /*
     * O bilhete para o aplicativo — e ele estava faltando.
     *
     * `arrival.ts` existe para que a câmera se assente ao chegar no app, e quem
     * o emitia era o `MapFlyover`, ao pousar. Quando a entrada trocou o sobrevoo
     * pelo passeio, o bilhete parou de ser emitido: `consumeArrival()` passou a
     * devolver `false` sempre, e a volta ao enquadramento do `MapChrome` virou
     * código morto.
     *
     * A consequência era visível e ninguém tinha por onde notar: o passeio deixa
     * a câmera INCLINADA em 55° com o relevo 3D ligado, e entrar levava esse
     * enquadramento para dentro do produto. O mapa do aplicativo aparecia torto,
     * numa aplicação onde a rotação está desligada justamente para o norte ser
     * fixo — e sem gesto nenhum capaz de endireitá-lo.
     *
     * Marcado na montagem, e não ao terminar, porque este passeio é contínuo:
     * ele não pousa, ele é interrompido por quem entra.
     */
    markArrival()

    if (reducedMotion || !running) {
      // Sem viagem: o produto ainda se apresenta, com um lugar de verdade na
      // tela, mas nada se move.
      showStopImmediately(map, places[index] ?? first, PANEL_PADDING)
      return
    }

    return runTour(map, places, {
      padding: PANEL_PADDING,
      onStopChange: setIndex,
    })
    // `index` fora das dependências de propósito: ele é ESCRITO por este efeito
    // a cada parada, e lê-lo aqui reiniciaria o passeio a cada troca de lugar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, places, reducedMotion, running])

  if (places.length === 0) return null

  const place = places[index] ?? places[0]
  if (!place) return null

  return (
    <div className="mt-8 border-t border-line pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="instrument-label">Agora no mapa</span>

        {/* A saída que faltava (RASTRO-010 da auditoria): antes o movimento
            rodava por onze segundos sem oferecer parada. Agora ele é contínuo,
            e por isso a saída deixou de ser opcional. */}
        {running && !reducedMotion ? (
          <button
            type="button"
            onClick={() => setRunning(false)}
            className="press -my-2 -mr-2 flex h-11 items-center rounded-full px-2
                       text-micro tracking-[0.1em] text-ink-faint uppercase
                       hover:text-ink-muted"
          >
            Parar
          </button>
        ) : null}
      </div>

      {/* `key` no nome: remonta o bloco a cada troca, e o fade de entrada do
          sistema roda de novo. Sem isto o texto trocaria seco no meio do voo. */}
      <div key={place.slug} className="fade-in-item mt-2">
        {/* Sem `next/image`: a origem é o Wikimedia, e configurar o otimizador
            para um domínio externo custaria mais do que entrega numa imagem que
            já vem redimensionada em 1600px pelo próprio Commons.

            `aspect-video` reserva o espaço antes de a imagem chegar — é o que
            substitui o skeleton, proibido pelo ADR 0009. Nada pula. */}
        {place.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={place.coverImageUrl}
            alt=""
            loading="lazy"
            className="mb-2.5 aspect-video w-full rounded-sm border border-line
                       object-cover"
          />
        ) : null}

        <p className="text-body text-ink">{place.name}</p>
        <p className="instrument-value mt-0.5 text-micro text-ink-faint">
          {CATEGORY_LABELS[place.category]} · {place.municipality} ·{' '}
          {place.stateCode}
        </p>
        {place.description ? (
          <p className="mt-1.5 text-small leading-relaxed text-ink-muted">
            {place.description}
          </p>
        ) : null}

        {/* O crédito NÃO é enfeite: CC BY e CC BY-SA liberam a foto sob a
            condição de atribuir. Sem esta linha, publicar a imagem
            descumpre a licença — por isso ela vive coladinha na foto e não
            num rodapé distante. */}
        {place.coverImageUrl && place.coverImageAuthor ? (
          <p className="mt-1.5 text-micro leading-snug text-ink-faint">
            Foto de {place.coverImageAuthor}
            {place.coverImageLicense ? ` · ${place.coverImageLicense}` : ''}
            {place.coverImageSource ? (
              <>
                {' · '}
                <a
                  href={place.coverImageSource}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline-offset-2 hover:underline"
                >
                  Wikimedia Commons
                </a>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
    </div>
  )
}
