/**
 * Por que a geolocalização falhou, na língua de quem está na estrada.
 *
 * O navegador entrega um código numérico e uma mensagem em inglês escrita para
 * quem programa. Nenhum dos dois serve para alguém parado no acostamento, de
 * luva, tentando descobrir para onde ir — e a diferença entre "você negou" e "o
 * aparelho não conseguiu" muda o que a pessoa deve fazer a seguir.
 */
export type GeolocationFailure =
  | 'sem-suporte'
  | 'negada'
  | 'indisponivel'
  | 'demorou'

export const GEOLOCATION_MESSAGES: Record<GeolocationFailure, string> = {
  'sem-suporte':
    'Este navegador não sabe informar sua localização. Busque o endereço abaixo.',
  negada:
    'Você negou o acesso à localização. Busque o endereço abaixo, ou libere a permissão nas configurações do navegador.',
  indisponivel:
    'Não foi possível obter sua localização agora — costuma ser sinal fraco de GPS. Busque o endereço abaixo.',
  demorou:
    'A localização demorou demais para responder. Busque o endereço abaixo.',
}

/** Códigos do `GeolocationPositionError`, que o padrão define como 1, 2 e 3. */
const PERMISSION_DENIED = 1
const POSITION_UNAVAILABLE = 2
const TIMEOUT = 3

/**
 * Traduz o erro do navegador para o vocabulário do produto.
 *
 * Recebe `unknown` de propósito: o objeto vem de uma API do navegador, e tratá-lo
 * como tipado seria confiar em algo que este código não controla. Qualquer coisa
 * que não seja um dos três códigos conhecidos vira `indisponivel` — o rótulo que
 * não promete saber a causa.
 */
export function classifyGeolocationError(error: unknown): GeolocationFailure {
  const code = (error as { code?: unknown } | null)?.code

  if (code === PERMISSION_DENIED) return 'negada'
  if (code === TIMEOUT) return 'demorou'
  if (code === POSITION_UNAVAILABLE) return 'indisponivel'
  return 'indisponivel'
}

/**
 * Nunca deixa a origem sem nome.
 *
 * A coordenada é o dado que a descoberta precisa; o nome é o que torna a viagem
 * reconhecível na lista seis meses depois. Quando a geocodificação reversa não
 * responde, um rótulo genérico é melhor que um campo vazio — e muito melhor que
 * desistir da origem inteira.
 */
export function originLabelFrom(reverseLabel: string | null): string {
  const limpo = reverseLabel?.trim() ?? ''
  return limpo.length > 0 ? limpo : 'Minha localização'
}
