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
