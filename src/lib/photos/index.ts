import { createCommonsClient } from './commons'
import type { CommonsClient } from './commons-client'

/**
 * Não recebe chave nem configuração: a API do Wikimedia Commons é aberta.
 *
 * É justamente por isso que ela foi escolhida em vez do Google Imagens — que não
 * licencia o que devolve, e cujos resultados são obras de terceiros com direitos
 * desconhecidos. Aqui cada foto vem com autor e licença nomeados, e a página do
 * arquivo permite conferir.
 */
export function getCommonsClient(): CommonsClient {
  return createCommonsClient()
}

export type { CommonsPhoto, CommonsClient } from './commons-client'
