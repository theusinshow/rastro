import type { Map as MapLibreMap } from 'maplibre-gl'

/**
 * Registra camadas nossas **e as mantém registradas** através de toda troca de
 * estilo.
 *
 * Existe porque a mesma armadilha derrubou três camadas diferentes deste
 * repositório, de três jeitos, e nenhuma delas deu erro. Centralizar é a única
 * forma de a correção não divergir na quarta.
 *
 * ## A armadilha
 *
 * `map.setStyle()` — que é o que trocar de tema faz — destrói todas as fontes e
 * camadas acrescentadas por nós. Para recolocá-las é preciso escutar o estilo
 * novo, e é aí que mora o engano:
 *
 * **`map.isStyleLoaded()` não significa "dá para acrescentar camada".** Ele
 * significa "o estilo *e as fontes dele* terminaram de carregar", que é outra
 * coisa e acontece bem depois. Medido no navegador, ao alternar dia e noite:
 *
 * ```
 * styledata  | isStyleLoaded = false
 * style.load | isStyleLoaded = false
 * styledata  | isStyleLoaded = false
 * (nenhum evento a mais)
 * ```
 *
 * Um `if (!map.isStyleLoaded()) return` no topo do registro rejeita **todos**
 * os eventos que importam, e depois deles não vem mais nada. O traçado da
 * viagem sumia de vez ao trocar de tema; os pins do catálogo, idem — apesar de
 * o ADR 0016 ter acrescentado a escuta de `styledata` justamente para evitar
 * isso. A escuta estava certa; a guarda dentro dela é que anulava a escuta.
 *
 * ## A regra
 *
 * O sinal correto é **`style.load`**, e a condição correta é o estilo
 * *existir* — não estar completo. Acrescentar fonte e camada logo depois de
 * `style.load` é o padrão que a própria MapLibre documenta.
 *
 * `apply` **precisa ser idempotente**: ele roda agora, roda a cada estilo novo,
 * e pode rodar mais de uma vez para o mesmo estilo. Na prática isso significa
 * perguntar `getSource`/`getLayer` antes de acrescentar — que é o que os três
 * chamadores já faziam.
 *
 * @returns a função de desligar, para o efeito devolver na limpeza.
 */
export function onStyleReady(
  map: MapLibreMap,
  apply: () => void,
): () => void {
  /*
   * Guarda de REENTRÂNCIA, e ela não é zelo — é obrigatória.
   *
   * `addSource` e `addLayer` disparam `styledata` de volta, de forma síncrona.
   * Sem esta trava, acrescentar a primeira camada reentra em `run`, que
   * acrescenta a segunda, que reentra de novo — e como há três componentes
   * escutando o mesmo mapa, cada um acrescentando as suas, a recursão é mútua e
   * cresce em cascata.
   *
   * Medido ao ligar a escuta sem ela: `Failed to execute 'postMessage' on
   * 'Worker': Maximum call stack size exceeded`, repetido, com o mapa em
   * branco. O erro aparece no worker do MapLibre e não diz nada sobre a causa.
   */
  let running = false

  function run() {
    if (running) return

    // `getStyle()` lança enquanto não há estilo nenhum — nos primeiros
    // milissegundos de vida do mapa, e depois de `remove()`. Perguntar assim é
    // mais honesto que confiar num `isStyleLoaded()` que responde outra coisa.
    try {
      if (!map.getStyle()) return
    } catch {
      return
    }

    running = true
    try {
      apply()
    } finally {
      running = false
    }
  }

  run()
  map.on('style.load', run)
  // Rede de segurança: `styledata` cobre carga de dados de estilo que não passa
  // por um `style.load` — a navegação pelo cliente, quando o mapa sobrevive à
  // troca de rota (ADR 0002) e o efeito remonta com o estilo já de pé.
  map.on('styledata', run)

  return () => {
    map.off('style.load', run)
    map.off('styledata', run)
  }
}
