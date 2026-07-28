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
    <div className="shrink-0 border-t border-line px-5 py-4">
      {/* Das quatro ações que ficavam sob "Em breve", três passaram a funcionar
          e vivem agora em `PlaceStateControls` e `PlaceVisits`, junto do dado
          que elas mudam. Sobrou "Criar viagem", que é a etapa seguinte. */}
      <a href={routeUrl(place)} target="_blank" rel="noreferrer" className="block">
        <Button size="sm" variant="solid" className="w-full">
          Abrir rota
        </Button>
      </a>

      <div className="mt-4">
        <span className="instrument-label">Em breve</span>
        <p className="mt-1.5 text-[11px] leading-relaxed text-ink-faint">
          Criar viagem
        </p>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-ink-faint">
        Criar viagem grava paradas e fotos, e fica disponível na etapa de
        viagens.
      </p>
    </div>
  )
}
