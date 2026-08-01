'use client'

import { useCallback, useState } from 'react'
import { reverseGeocodeAction } from '@/app/actions/geocoding-actions'
import type { Coordinates } from '@/domain/geo'
import {
  GEOLOCATION_MESSAGES,
  classifyGeolocationError,
  originLabelFrom,
} from '@/domain/geolocation'

interface UseMyLocationOptions {
  /** Recebe coordenada e nome já resolvido. O nome nunca vem vazio. */
  onLocated: (coordinates: Coordinates, label: string) => void
}

/**
 * A localização do aparelho, com toda falha já traduzida.
 *
 * Vive num hook, e não dentro de uma tela, porque dois lugares precisam dela por
 * motivos diferentes: a tela de origem preenche o formulário, e o muro da
 * descoberta grava direto e recarrega. Duplicar a classificação de erro em dois
 * componentes garantiria que um dos dois ficasse para trás.
 *
 * **Nunca lança e nunca bloqueia.** Toda falha vira `error`, e toda mensagem
 * aponta a busca de endereço, que não depende de permissão nenhuma.
 */
export function useMyLocation({ onLocated }: UseMyLocationOptions) {
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locate = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError(GEOLOCATION_MESSAGES['sem-suporte'])
      return
    }

    setLocating(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        // O nome é conveniência; a coordenada é o dado. Se a geocodificação
        // reversa não responder, `originLabelFrom` devolve um rótulo genérico e
        // a origem continua utilizável.
        void reverseGeocodeAction(coordinates.latitude, coordinates.longitude)
          .then((nome) => {
            onLocated(coordinates, originLabelFrom(nome))
          })
          .finally(() => setLocating(false))
      },
      (falha) => {
        setError(GEOLOCATION_MESSAGES[classifyGeolocationError(falha)])
        setLocating(false)
      },
      // 10 s separa "o GPS está pensando" de "isto não vai responder".
      // `enableHighAccuracy` desligado: precisão de rua basta para medir
      // distância de passeio, e ligá-la custa bateria e tempo.
      { timeout: 10_000, maximumAge: 60_000, enableHighAccuracy: false },
    )
  }, [onLocated])

  return { locate, locating, error }
}
