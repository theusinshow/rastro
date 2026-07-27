import { OverlayPanel } from '@/components/layout/OverlayPanel'

export default function ViagensPage() {
  return (
    <OverlayPanel side="right">
      <h1 className="sr-only">Viagens registradas</h1>
      <div className="flex flex-1 flex-col justify-center gap-3 px-5">
        <span className="instrument-label">Viagens</span>
        <p className="text-sm leading-relaxed text-ink-muted">
          Ainda não há viagens registradas. O registro de viagens entra numa
          próxima etapa.
        </p>
      </div>
    </OverlayPanel>
  )
}
