/**
 * Para onde vai quem acabou de entrar.
 *
 * O Rastro mede tudo a partir de um ponto: distância até um lugar, tempo de ida
 * e volta, o raio do filtro, os destinos que cabem numa tarde, e agora os postos
 * mais perto. Sem esse ponto, metade do produto responde `—` e a outra metade
 * pede que você defina a origem — o que é pedir a mesma coisa quatro vezes, em
 * quatro telas diferentes, depois de a pessoa já ter escolhido usar o app.
 *
 * Então perguntar uma vez, na entrada, é o momento certo.
 */

/** A rota que pergunta de onde a pessoa sai. */
export const ORIGIN_SETUP_PATH = '/perfil/origem'

interface EntryDecision {
  /** O perfil já tem um ponto de partida gravado. */
  hasOrigin: boolean
  /** Para onde a pessoa pediu para ir — o `proximo` da URL, já validado. */
  requested: string
}

/**
 * A tela de origem **só entra no lugar do destino padrão**.
 *
 * Quem foi barrado tentando abrir `/viagens/serra-do-rio-do-rastro` e entrou
 * para chegar lá continua chegando lá. Sequestrar esse caminho para perguntar o
 * endereço de casa seria trocar a intenção da pessoa pela nossa — e a origem
 * pode ser definida depois, de dentro do produto, como sempre pôde.
 *
 * Também não redireciona quem já tem origem: a pergunta é de primeira vez, não
 * de toda vez. Trocar de partida continua sendo uma visita deliberada à mesma
 * tela pelo menu.
 */
export function destinationAfterEntry({
  hasOrigin,
  requested,
}: EntryDecision): string {
  if (hasOrigin) return requested
  return requested === '/' ? ORIGIN_SETUP_PATH : requested
}
