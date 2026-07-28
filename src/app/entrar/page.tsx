import { isSupabaseConfigured } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { signInWithGoogleAction } from './actions'

const ERROR_MESSAGES: Record<string, string> = {
  oauth: 'O Google não respondeu. Tente novamente.',
  'sem-codigo': 'A volta do Google veio sem o código de autorização.',
  troca: 'O código de autorização não foi aceito. Tente entrar de novo.',
}

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string }>
}) {
  const { proximo, erro } = await searchParams
  const configured = isSupabaseConfigured()

  return (
    <main className="flex h-screen flex-col items-center justify-center bg-void px-6">
      <div className="w-full max-w-sm border-t border-line pt-8">
        <span className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em] text-ink uppercase">
          <span aria-hidden className="h-3.5 w-0.5 bg-accent" />
          Rastro
        </span>

        <h1 className="mt-6 text-lg leading-tight font-medium text-ink">
          O mapa da sua vida sobre duas rodas
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Onde você já esteve, o que ainda quer conhecer, e as histórias que
          ficaram dessas viagens.
        </p>

        {configured ? (
          <form action={signInWithGoogleAction} className="mt-8">
            <input type="hidden" name="proximo" value={proximo ?? '/'} />
            <Button type="submit" variant="outline" className="w-full">
              Entrar com o Google
            </Button>
          </form>
        ) : (
          <p className="mt-8 border-t border-line pt-4 text-xs leading-relaxed text-ink-muted">
            O banco de dados não está configurado. Defina{' '}
            <span className="instrument-value">NEXT_PUBLIC_SUPABASE_URL</span> e{' '}
            <span className="instrument-value">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>{' '}
            em <span className="instrument-value">.env.local</span> e reinicie o
            servidor.
          </p>
        )}

        {erro ? (
          <p className="mt-4 text-xs leading-relaxed text-ink-muted">
            {ERROR_MESSAGES[erro] ?? 'Não foi possível entrar.'}
          </p>
        ) : null}
      </div>
    </main>
  )
}
