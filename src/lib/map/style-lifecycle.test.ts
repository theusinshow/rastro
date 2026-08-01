import { describe, expect, it, vi } from 'vitest'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { onStyleReady } from './style-lifecycle'

/**
 * Um mapa de mentira com o que este módulo toca — e com a parte que importa: os
 * eventos são **síncronos**, como no MapLibre de verdade. É essa sincronia que
 * cria a reentrância que a guarda existe para conter.
 */
function fakeMap(options: { style?: unknown; lancaGetStyle?: boolean } = {}) {
  const handlers = new Map<string, Set<() => void>>()

  const map = {
    getStyle() {
      if (options.lancaGetStyle) throw new Error('sem estilo')
      return 'style' in options ? options.style : { layers: [] }
    },
    on(event: string, handler: () => void) {
      if (!handlers.has(event)) handlers.set(event, new Set())
      handlers.get(event)!.add(handler)
    },
    off(event: string, handler: () => void) {
      handlers.get(event)?.delete(handler)
    },
    /** O que `addSource`/`addLayer` fazem de verdade: avisam, na hora. */
    emit(event: string) {
      for (const handler of [...(handlers.get(event) ?? [])]) handler()
    },
    contagem(event: string) {
      return handlers.get(event)?.size ?? 0
    },
  }

  return map as typeof map & MapLibreMap
}

describe('onStyleReady', () => {
  it('aplica na hora, sem esperar evento nenhum', () => {
    const apply = vi.fn()
    onStyleReady(fakeMap(), apply)

    expect(apply).toHaveBeenCalledTimes(1)
  })

  it('aplica de novo a cada estilo novo', () => {
    // É o caso da troca de tema: `setStyle` derruba tudo que é nosso.
    const apply = vi.fn()
    const map = fakeMap()
    onStyleReady(map, apply)

    map.emit('style.load')
    map.emit('styledata')

    expect(apply).toHaveBeenCalledTimes(3)
  })

  it('NÃO exige `isStyleLoaded`, que é o que quebrava antes', () => {
    // O mapa de mentira nem tem `isStyleLoaded`. Se este módulo voltasse a
    // consultá-lo, o teste estouraria aqui — que é exatamente a regressão a
    // impedir: medido no navegador, `style.load` chega com ele em `false`.
    const apply = vi.fn()
    const map = fakeMap()

    expect(() => onStyleReady(map, apply)).not.toThrow()
    expect(apply).toHaveBeenCalled()
  })

  it('não aplica enquanto não existe estilo', () => {
    const apply = vi.fn()
    onStyleReady(fakeMap({ style: null }), apply)

    expect(apply).not.toHaveBeenCalled()
  })

  it('`getStyle` que lança é ausência de estilo, não falha', () => {
    // Acontece nos primeiros milissegundos do mapa e depois de `remove()`.
    const apply = vi.fn()

    expect(() =>
      onStyleReady(fakeMap({ lancaGetStyle: true }), apply),
    ).not.toThrow()
    expect(apply).not.toHaveBeenCalled()
  })

  it('não reentra: acrescentar camada dispara o próprio evento que a chamou', () => {
    /*
     * A regressão que derrubou o mapa inteiro com
     * "Maximum call stack size exceeded" no worker do MapLibre.
     *
     * `addLayer` emite `styledata` de forma síncrona. Um `apply` que acrescenta
     * camadas reentra em si mesmo, e com três componentes escutando o mesmo
     * mapa a recursão é mútua.
     */
    const map = fakeMap()
    let profundidade = 0
    let maxima = 0

    const apply = vi.fn(() => {
      profundidade += 1
      maxima = Math.max(maxima, profundidade)
      // Simula `addLayer`, que avisa na hora.
      if (profundidade < 5) map.emit('styledata')
      profundidade -= 1
    })

    onStyleReady(map, apply)

    expect(maxima).toBe(1)
    expect(apply).toHaveBeenCalledTimes(1)
  })

  it('a trava é solta depois, e o próximo estilo continua sendo atendido', () => {
    const map = fakeMap()
    const apply = vi.fn(() => map.emit('styledata'))
    onStyleReady(map, apply)

    expect(apply).toHaveBeenCalledTimes(1)
    map.emit('style.load')
    expect(apply).toHaveBeenCalledTimes(2)
  })

  it('desligar remove as duas escutas', () => {
    const map = fakeMap()
    const stop = onStyleReady(map, vi.fn())

    expect(map.contagem('style.load')).toBe(1)
    expect(map.contagem('styledata')).toBe(1)

    stop()

    expect(map.contagem('style.load')).toBe(0)
    expect(map.contagem('styledata')).toBe(0)
  })
})
