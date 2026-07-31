import type { Coordinates } from './geo'

/**
 * Quem está usando o produto.
 *
 * `home` é nulo até o usuário escolher a origem clicando no mapa. Nulo é um
 * estado legítimo e a interface precisa tratá-lo: raio e descoberta dependem de
 * uma origem, e inventar uma faria o produto mentir sobre distâncias.
 */
export interface Profile {
  id: string
  displayName: string | null
  home: Coordinates | null
  homeLabel: string | null
  /**
   * Autonomia da moto em quilômetros, informada por quem pilota.
   *
   * Nulo significa "não informei", e é estado legítimo: nesse caso o produto
   * **não opina** sobre combustível. Chutar uma autonomia média seria inventar
   * dado sobre o veículo de outra pessoa.
   */
  autonomyKm: number | null
}
