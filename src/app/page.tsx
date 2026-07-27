import { Button } from '@/components/ui/Button'
import { Stat } from '@/components/ui/Stat'

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-start gap-6 p-12">
      <span className="instrument-label">Rastro · verificação de tokens</span>
      <div className="flex gap-6">
        <Stat label="Distância" value="412" unit="km" />
        <Stat label="Duração" value="8h32" />
      </div>
      <div className="flex gap-2">
        <Button variant="solid">Encontrar destino</Button>
        <Button>Quero conhecer</Button>
        <Button disabled>Criar viagem</Button>
      </div>
    </main>
  )
}
