'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { formatCoordinate, type Coordinates } from '@/domain/geo'
import { setHomeAction } from '@/app/actions/profile-actions'
import { OverlayPanel } from '@/components/layout/OverlayPanel'
import { useOrigin } from '@/components/layout/origin-context'
import { PointPicker } from '@/components/map/PointPicker'
import { Button } from '@/components/ui/Button'

export function OriginSetup() {
  const router = useRouter()
  const { origin: current, label: currentLabel } = useOrigin()
  const [point, setPoint] = useState<Coordinates | null>(current)
  const [label, setLabel] = useState(currentLabel ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Identidade estável: sem `useCallback`, o efeito do PointPicker remonta a
  // cada render e o modo de mira pisca.
  const handlePick = useCallback((picked: Coordinates) => {
    setPoint(picked)
  }, [])

  function save() {
    if (!point) return
    startTransition(async () => {
      const result = await setHomeAction(point.latitude, point.longitude, label)
      if (result.ok) router.push('/')
      else setError(result.message)
    })
  }

  return (
    <>
      <PointPicker onPick={handlePick} />

      <OverlayPanel side="right">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <div>
            <span className="instrument-label">Ponto de partida</span>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              Clique no mapa onde suas viagens começam. Toda distância e todo
              cálculo de tempo do Rastro partem daqui.
            </p>
          </div>

          <div className="border-t border-line pt-3">
            <span className="instrument-label">Coordenada</span>
            <p className="instrument-value mt-1 text-sm text-ink">
              {point
                ? `${formatCoordinate(point.latitude)} ${formatCoordinate(point.longitude)}`
                : 'aguardando o clique'}
            </p>
          </div>

          <label className="block">
            <span className="instrument-label">Como chamar</span>
            <input
              type="text"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Palhoça, SC"
              className="mt-1.5 w-full rounded-xs border border-line bg-raised px-2
                         py-1.5 text-sm text-ink placeholder:text-ink-faint"
            />
          </label>

          {error ? (
            <p className="text-xs leading-relaxed text-ink-muted">{error}</p>
          ) : null}

          <Button
            type="button"
            variant="solid"
            size="sm"
            onClick={save}
            disabled={!point || pending}
            className="w-full"
          >
            {pending ? 'Gravando…' : 'Definir origem'}
          </Button>
        </div>
      </OverlayPanel>
    </>
  )
}
