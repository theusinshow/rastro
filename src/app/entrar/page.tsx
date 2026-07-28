import { isSupabaseConfigured } from '@/lib/supabase/server'
import { MapCanvas } from '@/components/map/MapCanvas'
import { MapProvider } from '@/components/map/map-context'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
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
    /*
     * A entrada usa a MESMA estrutura do aplicativo: mapa como superfície,
     * painel ancorado por cima. Não é um formulário centralizado num vazio — é o
     * produto já visível antes de entrar, e o painel apenas troca de conteúdo
     * depois do login.
     *
     * O mapa entra sem interação: ele diz o que o produto é, e não deve competir
     * com o único controle da tela nem ocupar uma parada de tabulação. O
     * MapLibre só põe `tabindex` no canvas quando é interativo.
     *
     * Abaixo de 768px o painel toma a tela inteira. Numa largura de 375px o que
     * sobraria de mapa não informa nada e só roubaria contraste do texto.
     */
    <MapProvider>
      <main className="relative flex h-screen overflow-hidden bg-void">
        {/* O painel vem ANTES do mapa no DOM, e é posicionado por CSS. A
            atribuição do MapLibre é obrigação de licença e traz três paradas de
            foco; renderizada antes, ela empurrava o único botão da tela para a
            quarta posição de tabulação. Mesma correção do P2.8 da auditoria: a
            ordem visual não muda, a de foco melhora três posições. */}
        <div
          className="relative z-20 flex h-full w-full shrink-0 flex-col
                     justify-center overflow-y-auto border-line bg-base px-6
                     py-10 md:w-104 md:border-r md:px-10"
        >
          {/* Com placa e em 56px: é a única tela onde a marca é o elemento
              principal, e não um selo ao lado da navegação. */}
          <span className="flex items-center gap-3 text-lead font-semibold tracking-[0.18em] text-ink uppercase">
            <Logo size={56} plate />
            Rastro
          </span>

          <h1 className="mt-8 text-title font-medium text-ink">
            O mapa da sua vida sobre duas rodas
          </h1>

          <p className="mt-3 text-body leading-relaxed text-ink-muted">
            Onde você já esteve, o que ainda quer conhecer, e as histórias que
            ficaram dessas viagens.
          </p>

          {configured ? (
            <form action={signInWithGoogleAction} className="mt-8">
              <input type="hidden" name="proximo" value={proximo ?? '/'} />
              {/* `solid`: é a única ação da tela. Estava `outline`, que o
                  sistema reserva para ação secundária. */}
              <Button type="submit" variant="solid" size="lg" className="w-full">
                Entrar com o Google
              </Button>
            </form>
          ) : (
            <p className="mt-8 border-t border-line pt-4 text-small leading-relaxed text-ink-muted">
              O banco de dados não está configurado. Defina{' '}
              <span className="instrument-value">NEXT_PUBLIC_SUPABASE_URL</span>{' '}
              e{' '}
              <span className="instrument-value">
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </span>{' '}
              em <span className="instrument-value">.env.local</span> e reinicie
              o servidor.
            </p>
          )}

          {erro ? (
            <div className="mt-8 border-t border-line pt-4">
              <span className="instrument-label">Não foi possível entrar</span>
              <p className="mt-2 text-small leading-relaxed text-ink-muted">
                {ERROR_MESSAGES[erro] ?? 'A entrada falhou.'}
              </p>
              {/* Mesma decisão do MapLoadError: a mensagem técnica fica visível.
                  Escondê-la trocaria uma causa conhecida por uma tela genérica. */}
              {detalhe ? (
                <p className="mt-3 text-small leading-relaxed text-ink-faint">
                  <code className="instrument-value">{detalhe}</code>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <MapCanvas interactive={false} />
      </main>
    </MapProvider>
  )
}
