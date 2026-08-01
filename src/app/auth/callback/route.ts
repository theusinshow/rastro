import { NextResponse, type NextRequest } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { destinationAfterEntry } from '@/domain/onboarding'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { readCallbackParams } from './outcome'

/**
 * O perfil já tem um ponto de partida?
 *
 * Pergunta feita com o MESMO cliente que acabou de trocar o código por uma
 * sessão, e não pelo repositório de `lib/data`: aquele monta um cliente novo a
 * partir dos cookies da requisição, e o cookie desta sessão só existe na
 * RESPOSTA que ainda está sendo escrita. Ele leria "sem usuário" e mandaria todo
 * mundo para a tela de origem, inclusive quem já definiu a sua.
 *
 * Erro de leitura vira `true` — "já tem". Numa dúvida, o menos pior é mandar a
 * pessoa para o mapa: ela chega ao produto e define a origem quando quiser. O
 * contrário a prenderia numa pergunta que ela talvez já tenha respondido.
 */
async function hasOrigin(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) return true

    const { data, error } = await supabase
      .from('profiles')
      .select('home_latitude, home_longitude')
      .eq('id', auth.user.id)
      .maybeSingle<{ home_latitude: number | null; home_longitude: number | null }>()

    if (error || !data) return false
    // As duas andam juntas: meia origem não é origem.
    return data.home_latitude !== null && data.home_longitude !== null
  } catch {
    return true
  }
}

function backToLogin(origin: string, reason: string, detail?: string | null) {
  const url = new URL('/entrar', origin)
  url.searchParams.set('erro', reason)
  if (detail) url.searchParams.set('detalhe', detail)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const outcome = readCallbackParams(searchParams)

  if (outcome.kind === 'failed') {
    return backToLogin(origin, outcome.reason, outcome.detail)
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(outcome.code)

  if (error) {
    return backToLogin(origin, 'troca', error.message)
  }

  /*
   * Quem entra sem ponto de partida cai na tela que pergunta por ele.
   *
   * Não é muro: a tela tem uma saída visível para o mapa. É só que perguntar
   * uma vez, na entrada, evita pedir a mesma coisa em quatro telas diferentes
   * depois — o raio do filtro, a descoberta, a distância de cada lugar e os
   * postos partem todos daqui.
   */
  const destination = destinationAfterEntry({
    hasOrigin: await hasOrigin(supabase),
    requested: outcome.destination,
  })

  return NextResponse.redirect(new URL(destination, origin))
}
