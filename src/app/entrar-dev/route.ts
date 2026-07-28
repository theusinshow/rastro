import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Entrada por senha, só em desenvolvimento.
 *
 * **Isto não é um desvio de autenticação.** A credencial é verificada pelo
 * Supabase como qualquer outra: sem e-mail e senha válidos, não entra. O que
 * muda é só o provedor — e-mail em vez de Google — porque o Google recusa
 * completar OAuth dentro de um navegador automatizado, e sem entrar não há como
 * inspecionar nem medir a interface logada.
 *
 * Deixar o app escrever o cookie, em vez de forjá-lo no script de automação,
 * é deliberado: o formato de sessão do `@supabase/ssr` é detalhe interno e muda
 * entre versões. Aqui ele é escrito por quem é dono dele.
 *
 * Três portões, e qualquer um sozinho já fecha a rota:
 *
 * 1. `NODE_ENV === 'production'` devolve 404. `next build` fecha isto sozinho.
 * 2. As duas variáveis vivem só em `.env.local`, que é ignorado pelo git —
 *    num ambiente de produção elas não existem, e a rota devolve 404.
 * 3. Mesmo alcançável, exige credencial correta. Não há nada aqui que dispense
 *    a senha.
 */
export async function GET(request: NextRequest) {
  const naoProducao = process.env.NODE_ENV !== 'production'
  const email = process.env.RASTRO_DEV_LOGIN_EMAIL
  const password = process.env.RASTRO_DEV_LOGIN_PASSWORD

  if (!naoProducao || !email || !password) {
    return new NextResponse('Not found', { status: 404 })
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return new NextResponse(`entrada de desenvolvimento recusada: ${error.message}`, {
      status: 401,
    })
  }

  const proximo = request.nextUrl.searchParams.get('proximo')
  const destino = proximo && proximo.startsWith('/') && !proximo.startsWith('//')
    ? proximo
    : '/'

  return NextResponse.redirect(new URL(destino, request.nextUrl.origin))
}
