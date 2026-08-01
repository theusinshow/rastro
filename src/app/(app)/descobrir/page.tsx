import { getPlaceRepository, getProfileRepository } from '@/lib/data'
import { isSupabaseConfigured } from '@/lib/supabase/server'
import { DataFallback } from '@/components/layout/DataFallback'
import { DiscoveryView } from '@/components/explore/DiscoveryView'

export default async function DescobrirPage() {
  if (!isSupabaseConfigured()) return <DataFallback />

  const repository = await getPlaceRepository()
  const places = await repository.listExplorePlaces()

  /*
   * A autonomia entra na descoberta, e não só no roteiro.
   *
   * Ela vivia uma tela adiante: a pessoa escolhia um destino sem saber se a
   * volta cabia no tanque, e só descobria depois de montar o roteiro. Para uma
   * moto de 180 km isso é a diferença entre um passeio e um problema — e era
   * parte do RASTRO-005 da auditoria.
   *
   * Nula quando nunca foi informada, e aí o produto **não opina** sobre
   * combustível. Ver `planRefuelStops`.
   */
  const profile = await (await getProfileRepository()).getProfile()

  return (
    <DiscoveryView places={places} autonomyKm={profile?.autonomyKm ?? null} />
  )
}
