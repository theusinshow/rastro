import type { Map as MapLibreMap } from 'maplibre-gl'

/**
 * Liga e desliga a interação com o mapa **sem recriá-lo**.
 *
 * Antes isto era a opção `interactive` do construtor, decidida por quem
 * montava o `MapCanvas`. Com o mapa vivendo no layout raiz (ADR 0018) a
 * decisão passou a mudar durante a vida da instância — a entrada quer cenário,
 * o app quer mapa — e o construtor não alcança isso.
 *
 * O `tabIndex` faz parte da desligada, e não é detalhe: o MapLibre põe o canvas
 * na ordem de tabulação quando ele é interativo, e na tela de entrada isso
 * empurrava o único botão da tela para depois de uma parada de foco que não
 * leva a lugar nenhum. Era o que a opção do construtor resolvia de graça, e é o
 * que precisa ser reposto à mão.
 */
export function setMapInteractive(map: MapLibreMap, interactive: boolean): void {
  const handlers = [
    map.dragPan,
    map.scrollZoom,
    map.boxZoom,
    map.doubleClickZoom,
    map.touchZoomRotate,
    map.keyboard,
  ]

  for (const handler of handlers) {
    if (interactive) handler.enable()
    else handler.disable()
  }

  // Rotação continua fora dos dois estados: o norte é fixo por decisão de
  // cartografia, não por a tela ser cenário.
  map.dragRotate.disable()
  map.touchZoomRotate.disableRotation()

  map.getCanvas().tabIndex = interactive ? 0 : -1
}
