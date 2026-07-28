/**
 * O que fazer com a volta do provedor de identidade.
 *
 * Função pura e separada da rota porque é onde moram as decisões — inclusive a
 * guarda de redirecionamento aberto — e uma rota `GET` não é testável sem subir
 * o servidor.
 */
export type CallbackOutcome =
  | { kind: 'exchange'; code: string; destination: string }
  | { kind: 'failed'; reason: 'provedor' | 'sem-codigo'; detail: string | null }

/**
 * Só caminho relativo de um nível.
 *
 * `//evil.com` é protocolo-relativo: começa com `/` e mesmo assim sai do site.
 * Sem esta segunda checagem, a guarda de "começa com barra" seria contornável.
 */
function safeDestination(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

export function readCallbackParams(params: URLSearchParams): CallbackOutcome {
  const code = params.get('code')
  if (code) {
    return {
      kind: 'exchange',
      code,
      destination: safeDestination(params.get('proximo')),
    }
  }

  // O provedor explica a falha em `error_description`; descartá-la e responder
  // "veio sem o código" transformaria uma causa conhecida numa tela genérica.
  const error = params.get('error')
  if (error) {
    return {
      kind: 'failed',
      reason: 'provedor',
      detail: params.get('error_description') ?? error,
    }
  }

  return { kind: 'failed', reason: 'sem-codigo', detail: null }
}
