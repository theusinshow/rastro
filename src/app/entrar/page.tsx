import { isSupabaseConfigured } from '@/lib/supabase/server'
import { MapFlyover } from '@/components/map/MapFlyover'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { signInAsGuestAction, signInWithGoogleAction } from './actions'

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
  // Nomear a chave exata do painel é o que torna o erro acionável, pelo mesmo
  // critério da mensagem `provedor` acima.
  visitante:
    'A entrada de visitante está desligada no projeto. Ligue em ' +
    'Authentication → Sign In / Providers → Allow anonymous sign-ins, no ' +
    'painel do Supabase.',
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
     * O mapa não é montado aqui: ele vive no layout raiz desde o ADR 0018, e é a
     * MESMA instância que o app recebe depois do login — é isso que permite ao
     * sobrevoo terminar sem costura. `MapChrome` o deixa sem interação nesta
     * rota: ele diz o que o produto é, e não deve competir com o único controle
     * da tela nem ocupar uma parada de tabulação.
     *
     * Abaixo de 768px o painel toma a tela inteira. Numa largura de 375px o que
     * sobraria de mapa não informa nada e só roubaria contraste do texto.
     */
    <>
      <MapFlyover />
      <main className="relative flex h-screen overflow-hidden">
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
          {/* Lockup: é a única tela onde a marca é o elemento principal, e não
              um selo ao lado da navegação.

              Sem placa. A placa é da cor do painel — sobre esta tela ela não
              desenhava nada, só encolhia a marca para 74% do quadrado. Placa é
              para quando a marca pousa sobre algo que não controlamos: ícone de
              app, aba do navegador. */}
          <span className="flex items-center gap-4 text-ink">
            <Logo size={56} />
            {/* Hairline do lockup: separa a marca da palavra sem inventar um
                elemento novo. É a mesma régua de 1px que separa tudo no
                produto. */}
            <span aria-hidden className="h-10 w-px bg-line-strong" />
            <span className="type-wordmark text-title">Rastro</span>
          </span>

          {/*
            Lidera com HOJE, e não com o passado.

            A frase anterior — "o mapa da sua vida sobre duas rodas", seguida de
            "onde você já esteve... as histórias que ficaram" — gastava dois
            terços do texto no que já aconteceu. É bonita e é verdadeira, mas
            define a expectativa errada: quem chega aqui está de moto e quer
            sair, e a pergunta que o produto existe para responder é "para
            onde".

            A memória continua na frase, no fim, que é onde ela entra na vida de
            quem usa: primeiro você vai, depois fica a história. Ver RASTRO-004.
          */}
          <h1 className="mt-8 text-title font-medium text-ink">
            Para onde você vai hoje?
          </h1>

          <p className="mt-3 text-body leading-relaxed text-ink-muted">
            Diga de onde parte e quanto tempo tem. O Rastro acha o destino, mede
            a ida e a volta — e guarda o que ficou de cada viagem.
          </p>

          {configured ? (
            <>
              <form action={signInWithGoogleAction} className="mt-8">
                <input type="hidden" name="proximo" value={proximo ?? '/'} />
                {/* `solid`: é a ação principal da tela. A segunda porta, abaixo,
                    não disputa esse peso — quem vai usar o produto entra por
                    aqui. */}
                <Button
                  type="submit"
                  variant="solid"
                  size="lg"
                  className="w-full"
                >
                  Entrar com o Google
                </Button>
              </form>

              {/* Visivelmente segunda: `outline` é o peso que o sistema reserva
                  para ação secundária. Ver ADR 0017. */}
              <form action={signInAsGuestAction} className="mt-3">
                <input type="hidden" name="proximo" value={proximo ?? '/'} />
                <Button
                  type="submit"
                  variant="outline"
                  size="lg"
                  className="w-full"
                >
                  Entrar sem conta
                </Button>
              </form>

              {/* O trato dito ANTES de ser aceito. A barra de cima repete depois
                  de entrar, mas quem escolhe merece saber o que escolheu. */}
              <p className="mt-3 text-small leading-relaxed text-ink-faint">
                Sem conta você vê e experimenta tudo, mas não sobe fotografia — e
                nada do que fizer fica salvo.
              </p>
            </>
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
      </main>
    </>
  )
}
