import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * `proxy.ts` e não `middleware.ts`: o Next 16 deprecou a convenção antiga, que
 * emitia aviso a cada requisição em desenvolvimento.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  // Tudo, menos estáticos e imagens. O filtro fino de quais rotas exigem sessão
  // fica em `updateSession`, junto da lista de rotas públicas, para não haver
  // duas listas que possam divergir.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
