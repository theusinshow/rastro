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

const PENDING_ACTIONS = [
  'Salvar',
  'Quero conhecer',
  'Marcar visitado',
  'Criar viagem',
]

export function PlaceActions({ place }: { place: ExplorePlace }) {
  return (
    <div className="shrink-0 border-t border-line px-5 py-4">
      {/* A única ação que funciona vem primeiro e sozinha. Antes ela ficava
          abaixo de uma grade 2×2 de quatro botões inertes de peso idêntico:
          quatro controles mortos com mais presença do que o que funciona.
          Manter o que ainda não existe visível continua sendo a decisão — o que
          muda é o peso. */}
      <a href={routeUrl(place)} target="_blank" rel="noreferrer" className="block">
        <Button size="sm" variant="solid" className="w-full">
          Abrir rota
        </Button>
      </a>

      <div className="mt-4">
        <span className="instrument-label">Em breve</span>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">
          {PENDING_ACTIONS.join(' · ')}
        </p>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
        Salvar, marcar visita e criar viagem gravam dados e ficam disponíveis
        quando o banco for conectado.
      </p>
    </div>
  )
}
