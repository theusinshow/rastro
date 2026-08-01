'use client'

import { useEffect, useState } from 'react'
import { placePhotosAction } from '@/app/actions/commons-actions'
import type { CommonsPhoto } from '@/lib/photos'

interface PlaceNearbyPhotosProps {
  latitude: number
  longitude: number
  name: string
}

/** `683` → `680 m`; `2232` → `2,2 km`. */
function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m`
  return `${(meters / 1000).toFixed(1).replace('.', ',')} km`
}

/**
 * Como é o lugar, pelos olhos de outras pessoas.
 *
 * A procedência de cada foto é a peça mais importante deste componente, e são
 * duas, com o que cada uma pode afirmar declarado na própria etiqueta:
 *
 * - **Por coordenada** — o arquivo tem GPS. A distância é fato, e vai escrita.
 *   Mas perto não é "deste lugar": medindo o catálogo real, a Serra do Corvo
 *   Branco traz uma foto da Pedra Furada do Morro da Igreja, a 2,2 km.
 * - **Por nome** — o arquivo casou com o nome na busca do Commons. Não há
 *   distância a afirmar, e o casamento é por texto: procurar "Santo Amaro da
 *   Imperatriz" devolve o hospital do município junto. Por isso o nome do
 *   arquivo aparece: é com ele que se julga.
 *
 * As duas convivem porque uma sozinha não serve. Só por coordenada, **dez dos
 * catorze lugares do catálogo não teriam foto nenhuma** — o litoral inteiro,
 * incluindo a Lagoa da Conceição. Foi medido antes de escrever isto.
 *
 * Autor e licença aparecem em toda foto porque a licença CC exige — não é
 * enfeite, é condição de uso. Foto sem licença declarada nem chega aqui.
 */
export function PlaceNearbyPhotos({
  latitude,
  longitude,
  name,
}: PlaceNearbyPhotosProps) {
  const [photos, setPhotos] = useState<CommonsPhoto[] | null>(null)

  useEffect(() => {
    let cancelled = false

    placePhotosAction(latitude, longitude, name).then((result) => {
      // Uma resposta que chega depois de o componente sair não escreve em nada.
      // Trocar de LUGAR não passa por aqui: o painel remonta este componente com
      // `key`, e o estado nasce vazio — mais simples que zerá-lo no efeito.
      if (!cancelled) setPhotos(result)
    })

    return () => {
      cancelled = true
    }
  }, [latitude, longitude, name])

  // Enquanto carrega, nada — e nada de skeleton, que o ADR 0016 proíbe. Uma
  // seção que não existe ainda é mais honesta que um retângulo cinza fingindo
  // conteúdo que pode nunca chegar.
  if (photos === null || photos.length === 0) return null

  return (
    <section className="border-b border-line py-4">
      <div className="flex items-baseline justify-between gap-3 px-5">
        <span className="instrument-label">Como é o lugar</span>
        <span className="instrument-label">Wikimedia Commons</span>
      </div>

      <p className="mt-1.5 px-5 text-small leading-relaxed text-ink-faint">
        Fotos de outras pessoas. As que têm coordenada mostram a distância; as
        demais foram achadas pelo nome e podem ser de outro ponto do município.
      </p>

      <ul className="mt-3 flex snap-x gap-2 overflow-x-auto px-5 scrollbar-none">
        {photos.map((photo) => (
          <li key={photo.id} className="shrink-0 snap-start">
            <a
              href={photo.descriptionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="press block w-40"
              title={photo.title}
            >
              {/* Sem `next/image`: a URL vem do Commons e o otimizador do Next
                  geraria uma variante nossa de obra de terceiro. Linkar o
                  original é também o que a atribuição pede. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.thumbnailUrl}
                alt=""
                loading="lazy"
                className="h-28 w-40 rounded-sm border border-line object-cover"
              />

              {/* A etiqueta muda com a procedência, e é aqui que o produto se
                  recusa a dizer o que não sabe: distância só onde ela existe. */}
              {photo.distanceM !== null ? (
                <span className="instrument-value mt-1.5 block text-micro text-ink-faint">
                  {formatDistance(photo.distanceM)}
                </span>
              ) : (
                <span className="mt-1.5 block truncate text-micro text-ink-faint">
                  {photo.title}
                </span>
              )}

              <span className="mt-0.5 block truncate text-micro text-ink-faint">
                {photo.license}
                {photo.author ? ` · ${photo.author}` : ''}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
