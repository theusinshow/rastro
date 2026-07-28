import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { readSupabaseConfig } from './config'

/** Rotas alcançáveis sem sessão. */
const PUBLIC_PATHS = ['/entrar', '/auth/callback']

/**
 * A entrada por senha de desenvolvimento precisa ser alcançável sem sessão —
 * é ela que cria a sessão. Some em produção junto com a própria rota, que
 * devolve 404 lá. Ver `src/app/entrar-dev/route.ts`.
 */
function isPublic(pathname: string): boolean {
  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.RASTRO_DEV_LOGIN_EMAIL &&
    pathname.startsWith('/entrar-dev')
  ) {
    return true
  }
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path))
}

/**
 * Renova a sessão e barra rota privada sem usuário.
 *
 * Precisa acontecer no middleware porque Server Components não podem escrever
 * cookie: se o refresh do token acontecesse na leitura da página, o cookie novo
 * nunca chegaria ao navegador e a sessão morreria na expiração seguinte.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const config = readSupabaseConfig(process.env)
  // Sem configuração não há sessão a renovar. Deixar passar é o que permite à
  // página mostrar o estado explícito de "não configurado" em vez de um
  // redirecionamento em laço para uma tela de login que também não funcionaria.
  if (!config) return response

  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(items) {
        for (const item of items) {
          request.cookies.set(item.name, item.value)
        }
        response = NextResponse.next({ request })
        for (const item of items) {
          response.cookies.set(item.name, item.value, item.options)
        }
      },
    },
  })

  // `getUser` e não `getSession`: só o primeiro valida o token contra o servidor
  // de autenticação. `getSession` confia no cookie, que é falsificável.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !isPublic(request.nextUrl.pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = '/entrar'
    // Preserva para onde a pessoa ia. Sessão que expira no meio de uma tarefa
    // não deveria custar o contexto da tarefa.
    url.search = ''
    url.searchParams.set(
      'proximo',
      request.nextUrl.pathname + request.nextUrl.search,
    )
    return NextResponse.redirect(url)
  }

  return response
}
