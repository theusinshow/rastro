import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const next = searchParams.get('proximo')
  const destination = next && next.startsWith('/') ? next : '/'

  if (!code) {
    return NextResponse.redirect(`${origin}/entrar?erro=sem-codigo`)
  }

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/entrar?erro=troca`)
  }

  return NextResponse.redirect(`${origin}${destination}`)
}
