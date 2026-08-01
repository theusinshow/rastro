import type { FuelQuery, FuelSearchOutcome } from '@/domain/fuel-stations'

/**
 * Postos de combustível de um provedor externo.
 *
 * Contrato irmão de `RoutingClient` e `WeatherClient`, com **uma diferença
 * deliberada**: aqui a falha não é `null`.
 *
 * Naqueles dois, `null` bastava porque o modo degradado é silencioso — a viagem
 * continua com distância estimada, a página continua sem o aviso de neblina.
 * Aqui não existe modo degradado: quem apertou "Postos" pediu uma coisa só, e
 * ou ela chega ou a pessoa precisa saber **por quê** para decidir se aperta
 * "tentar de novo" ou se desiste. Um `null` transformaria "acabou a cota de
 * hoje" e "a rede caiu" na mesma tela muda.
 *
 * O que **não** muda: a implementação NUNCA lança. Toda falha vira um
 * `FuelSearchFailure` nomeado, e o chamador continua tendo um caminho só.
 */
export interface FuelStationClient {
  search(query: FuelQuery): Promise<FuelSearchOutcome>
}
