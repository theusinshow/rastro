import { OverlayPanel } from '@/components/layout/OverlayPanel'

export default function MemoriasPage() {
  return (
    <OverlayPanel side="right">
      <h1 className="sr-only">Memórias de viagem</h1>
      <div className="flex flex-1 flex-col justify-center gap-3 px-5">
        <span className="instrument-label">Memórias</span>
        <p className="text-[1rem] leading-relaxed text-ink-muted">
          As memórias aparecem aqui quando houver viagens concluídas, organizadas
          por ano e mês.
        </p>
      </div>
    </OverlayPanel>
  )
}
