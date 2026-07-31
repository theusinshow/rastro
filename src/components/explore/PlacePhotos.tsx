'use client'

import { useEffect, useState, useTransition } from 'react'
import {
  addPhotoAction,
  deletePhotoAction,
  listPhotosAction,
} from '@/app/actions/photo-actions'
import { formatVisitDate } from '@/domain/dates'
import { ACCEPTED_IMAGE_TYPES, isAcceptedImageType } from '@/domain/photo'
import { readExif } from '@/lib/images/exif'
import { resizeToJpeg } from '@/lib/images/resize'
import { buildStoragePath } from '@/lib/images/storage-path'
import { getBrowserSupabaseClient } from '@/lib/supabase/browser'
import { Button } from '@/components/ui/Button'
import { InlineMessage } from '@/components/ui/InlineMessage'
import { SectionHeader } from '@/components/ui/Section'
import type { PhotoWithUrl } from '@/lib/data/photo-repository'

const BUCKET = 'fotos'

interface PlacePhotosProps {
  placeId: string
}

/**
 * Fotografias suas neste lugar.
 *
 * Distintas das do Wikimedia em `PlaceNearbyPhotos`: aquelas são de terceiros e
 * ficam *perto*; estas são memória, contam no mapa e são privadas.
 *
 * O upload vai do navegador direto para o Storage, e só depois uma Server Action
 * grava a linha — Server Actions do Next têm limite de corpo de 1 MB, e passar
 * binário por lá é frágil por construção. Ver ADR 0014.
 */
export function PlacePhotos({ placeId }: PlacePhotosProps) {
  const [photos, setPhotos] = useState<PhotoWithUrl[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    // Trocar de LUGAR não passa por aqui: o painel remonta este componente com
    // `key`, então o estado nasce vazio.
    listPhotosAction(placeId).then((result) => {
      if (!cancelled) setPhotos(result)
    })
    return () => {
      cancelled = true
    }
  }, [placeId])

  /**
   * Recarrega depois de subir ou apagar.
   *
   * O `revalidatePath` das actions não alcança esta lista: ela veio de uma
   * chamada de action, não de renderização do servidor.
   */
  async function reload() {
    setPhotos(await listPhotosAction(placeId))
  }

  /**
   * Recebe `File[]`, e nunca a `FileList` do evento.
   *
   * A `FileList` é VIVA: ela aponta para o input, e limpar o campo — o que
   * precisamos fazer para permitir reescolher o mesmo arquivo — a esvazia. Como
   * esta função só percorre a lista depois do primeiro `await`, passar a
   * `FileList` fazia o laço rodar sobre zero arquivos, sem erro nenhum. Copiar
   * antes é o que torna isto correto.
   */
  async function upload(files: File[]) {
    const client = getBrowserSupabaseClient()
    if (!client) {
      setError('Armazenamento não configurado.')
      return
    }

    const { data: sessao } = await client.auth.getUser()
    const userId = sessao.user?.id
    if (!userId) {
      setError('Sessão expirada. Entre de novo.')
      return
    }

    setBusy(true)
    setError(null)

    for (const file of files) {
      // Recusa ANTES de qualquer upload, com o motivo dito. HEIC do iPhone cai
      // aqui: o leitor de EXIF só entende JPEG e o canvas não decodifica HEIC.
      if (!isAcceptedImageType(file.type)) {
        setError(
          `"${file.name}" não é um formato que dá para processar aqui. Mande JPEG, PNG ou WebP.`,
        )
        continue
      }

      let storagePath: string | null = null
      try {
        // EXIF ANTES de encolher: reencodar no canvas destrói o bloco, e com
        // ele a data e a coordenada. A ordem é obrigação, não preferência.
        const exif = readExif(await file.arrayBuffer())
        const { blob, width, height } = await resizeToJpeg(file)

        storagePath = buildStoragePath(userId, placeId, crypto.randomUUID())
        const { error: erroUpload } = await client.storage
          .from(BUCKET)
          .upload(storagePath, blob, { contentType: 'image/jpeg' })

        if (erroUpload) {
          setError(`Não foi possível subir "${file.name}".`)
          storagePath = null
          continue
        }

        const result = await addPhotoAction({
          placeId,
          storagePath,
          width,
          height,
          coordinates: exif.coordinates,
          takenOn: exif.takenOn,
          caption: null,
        })

        if (!result.ok) {
          // Limpa o objeto recém-subido antes de mostrar o erro. Não é garantia
          // — o navegador pode fechar no meio — mas evita o caso comum de
          // arquivo pago e invisível. Ver spec de Fotos §8.
          await client.storage.from(BUCKET).remove([storagePath])
          setError(result.message)
        }
      } catch {
        if (storagePath) await client.storage.from(BUCKET).remove([storagePath])
        setError(`Não foi possível processar "${file.name}".`)
      }
    }

    await reload()
    setBusy(false)
  }

  function remove(photo: PhotoWithUrl) {
    startTransition(async () => {
      setError(null)
      const result = await deletePhotoAction(photo.id)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setConfirming(null)

      // A linha já saiu; o objeto vai atrás. Se esta parte falhar sobra arquivo
      // órfão — desperdício, mas invisível. O contrário seria foto quebrada na
      // tela, que o usuário vê.
      const client = getBrowserSupabaseClient()
      if (client && result.storagePath) {
        await client.storage.from(BUCKET).remove([result.storagePath])
      }

      await reload()
    })
  }

  return (
    <div className="border-b border-line px-5 py-4">
      <SectionHeader
        label="Suas fotografias"
        hint={photos.length === 0 ? 'nenhuma ainda' : undefined}
      />

      {photos.length > 0 ? (
        <ul className="mt-3 grid grid-cols-3 gap-1">
          {photos.map((photo) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() =>
                  setConfirming(confirming === photo.id ? null : photo.id)
                }
                className="press block w-full"
                aria-label={`Fotografia de ${photo.takenOn ? formatVisitDate(photo.takenOn) : 'data desconhecida'}`}
              >
                {/* Sem `next/image`: a URL é assinada e muda a cada leitura, e o
                    otimizador cachearia uma variante por assinatura.

                    `aspect-ratio` das dimensões gravadas reserva o espaço exato
                    antes de a imagem chegar — é o que substitui o skeleton, que
                    o ADR 0009 proíbe. Nada pula. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt=""
                  loading="lazy"
                  style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
                  className="w-full rounded-sm border border-line object-cover"
                />
              </button>

              <span className="instrument-value mt-1 block text-micro text-ink-faint">
                {/* Data desconhecida é dita, e nunca substituída pelo dia do
                    upload: a data em que você mexeu no arquivo não é a data em
                    que a foto foi tirada. */}
                {photo.takenOn ? formatVisitDate(photo.takenOn) : 'sem data'}
              </span>

              {confirming === photo.id ? (
                <Button
                  variant="danger"
                  size="sm"
                  className="mt-1 w-full"
                  disabled={pending}
                  onClick={() => remove(photo)}
                >
                  Apagar
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      <label className="mt-3 block">
        <span className="sr-only">Adicionar fotografias</span>
        <input
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          multiple
          disabled={busy}
          onChange={(event) => {
            // Copia ANTES de limpar: a FileList é viva e zerar o campo a
            // esvaziaria antes de o upload assíncrono chegar a lê-la.
            const escolhidos = Array.from(event.target.files ?? [])
            // Zera o campo para que escolher o MESMO arquivo de novo dispare
            // outro evento — sem isto, tentar de novo após um erro não faz nada.
            event.target.value = ''
            if (escolhidos.length > 0) void upload(escolhidos)
          }}
          className="press block w-full cursor-pointer rounded-sm border
                     border-line-strong bg-void px-4 py-3 text-small text-ink-muted
                     file:mr-3 file:rounded-sm file:border-0 file:bg-overlay
                     file:px-3 file:py-1.5 file:text-small file:text-ink
                     hover:border-ink-faint disabled:opacity-(--disabled-opacity)"
        />
      </label>

      {busy ? (
        <p className="mt-2 text-small text-ink-faint">Subindo…</p>
      ) : null}

      {error ? (
        <InlineMessage tone="error" className="mt-3">
          {error}
        </InlineMessage>
      ) : null}
    </div>
  )
}
