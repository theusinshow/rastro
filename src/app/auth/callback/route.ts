import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { readCallbackParams } from './outcome'

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

  return NextResponse.redirect(new URL(outcome.destination, origin))
}
