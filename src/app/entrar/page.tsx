import { isSupabaseConfigured } from '@/lib/supabase/server'
import { Button } from '@/components/ui/Button'
import { signInWithGoogleAction } from './actions'

const ERROR_MESSAGES: Record<string, string> = {
  oauth: 'Não foi possível iniciar a entrada pelo Google.',
  // O Google autorizou e devolveu um código, mas o Supabase não conseguiu
  // trocá-lo por uma sessão. Nomear a etapa é o que torna o erro acionável:
  // quase sempre é o Client Secret do provedor, no painel do Supabase.
  provedor:
    'O Google autorizou a entrada, mas a troca do código por uma sessão falhou. ' +
    'Isso costuma ser o Client Secret do provedor Google no painel do Supabase.',
  'sem-codigo': 'A volta do Google veio sem o código de autorização.',
  troca: 'O código de autorização não foi aceito. Tente entrar de novo.',
}

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string; erro?: string; detalhe?: string }>
}) {
  const { proximo, erro, detalhe } = await searchParams
  const configured = isSupabaseConfigured()

  return (
    <main className="flex h-screen flex-col items-center justify-center bg-void px-6">
      <div className="w-full max-w-sm border-t border-line pt-8">
        <span className="flex items-center gap-2 text-[1rem] font-semibold tracking-[0.18em] text-ink uppercase">
          <span aria-hidden className="h-3.5 w-0.5 bg-accent" />
          Rastro
        </span>

        <h1 className="mt-6 text-lg leading-tight font-medium text-ink">
          O mapa da sua vida sobre duas rodas
        </h1>

        <p className="mt-2 text-[1rem] leading-relaxed text-ink-muted">
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
          <p className="mt-8 border-t border-line pt-4 text-[0.9375rem] leading-relaxed text-ink-muted">
            O banco de dados não está configurado. Defina{' '}
            <span className="instrument-value">NEXT_PUBLIC_SUPABASE_URL</span> e{' '}
            <span className="instrument-value">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>{' '}
            em <span className="instrument-value">.env.local</span> e reinicie o
            servidor.
          </p>
        )}

        {erro ? (
          <div className="mt-6 border-t border-line pt-4">
            <span className="instrument-label">Não foi possível entrar</span>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink-muted">
              {ERROR_MESSAGES[erro] ?? 'A entrada falhou.'}
            </p>
            {/* Mesma decisão do MapLoadError: a mensagem técnica fica visível.
                Escondê-la trocaria uma causa conhecida por uma tela genérica. */}
            {detalhe ? (
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-faint">
                <code className="instrument-value">{detalhe}</code>
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  )
}
