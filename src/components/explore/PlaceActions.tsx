'use client'

import Link from 'next/link'
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
      {/* As quatro ações que ficavam sob "Em breve" agora funcionam: três vivem
          em `PlaceStateControls` e `PlaceVisits`, junto do dado que elas mudam, e
          a quarta é o roteiro abaixo. */}
      <a href={routeUrl(place)} target="_blank" rel="noreferrer" className="block">
        <Button size="sm" variant="solid" className="w-full">
          Abrir rota
        </Button>
      </a>

      {/* Monta um roteiro semeado por este lugar. Não cria viagem: leva para o
          formulário com a parada já escolhida, e lá se adiciona o resto.

          É a terceira entrada de montagem — a manual. Diferente das outras duas,
          aqui NÃO há pontuação de interesse: quem escolheu à mão não quer ver a
          sua escolha descartada por um critério que a máquina inventou. */}
      <Link
        href={`/viagens/nova?paradas=${place.id}`}
        className="mt-3 block"
      >
        <Button size="sm" variant="outline" className="w-full">
          Montar roteiro com este lugar
        </Button>
      </Link>

      {/* Só em lugar próprio. Sobre o catálogo compartilhado você tem opinião,
          não posse — e a RLS recusaria a escrita de qualquer forma. */}
      {place.isOwn ? (
        <Link
          href={`/lugar/${place.slug}/editar`}
          className="mt-3 block text-micro tracking-[0.14em] text-ink-faint
                     uppercase transition-colors hover:text-ink-muted"
        >
          Editar lugar
        </Link>
      ) : null}

      <div className="mt-4">
        <span className="instrument-label">Em breve</span>
        <p className="mt-1.5 text-small leading-relaxed text-ink-faint">
          Fotos da viagem
        </p>
      </div>
    </div>
  )
}
