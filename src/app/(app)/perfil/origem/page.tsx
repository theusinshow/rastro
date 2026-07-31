import { OriginSetup } from '@/components/onboarding/OriginSetup'
import { getProfileRepository } from '@/lib/data'

export default async function OrigemPage() {
  // A autonomia vem daqui, e não do contexto de origem: ela alimenta o cálculo
  // de combustível, não o enquadramento do mapa, e só esta tela a edita.
  const profile = await (await getProfileRepository()).getProfile()

  return (
    <>
      <h1 className="sr-only">Perfil de viagem</h1>
      <OriginSetup autonomyKm={profile?.autonomyKm ?? null} />
    </>
  )
}
