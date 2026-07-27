import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { animateProgress, easeOutQuart } from './animate-progress'

/**
 * `animateProgress` roda sobre `requestAnimationFrame`, que o ambiente `node`
 * dos testes não tem. Um dublê mínimo: guarda o callback agendado por id e
 * simula o navegador descartando um callback cancelado — `cancelAnimationFrame`
 * remove o id da fila antes de qualquer frame futuro poder invocá-lo.
 */
let scheduled: Map<number, FrameRequestCallback>
let nextId: number

function stubFrames() {
  scheduled = new Map()
  nextId = 0
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    nextId += 1
    scheduled.set(nextId, cb)
    return nextId
  })
  vi.stubGlobal('cancelAnimationFrame', (id: number) => {
    scheduled.delete(id)
  })
}

/** Invoca o frame agendado mais antigo, como se o navegador tivesse chegado nele. */
function runOldestFrame(now: number) {
  const [id] = scheduled.keys()
  if (id === undefined) throw new Error('nenhum frame agendado para rodar')
  const cb = scheduled.get(id)!
  scheduled.delete(id)
  cb(now)
}

describe('animateProgress', () => {
  beforeEach(() => {
    stubFrames()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('com durationMs <= 0, entrega o estado final num quadro só e não agenda nada', () => {
    const onFrame = vi.fn()
    const cancel = animateProgress(0, onFrame)

    expect(onFrame).toHaveBeenCalledTimes(1)
    expect(onFrame).toHaveBeenCalledWith(1)
    expect(scheduled.size).toBe(0)

    // Cancelar um tween que nunca chegou a agendar frame não deve explodir.
    expect(() => cancel()).not.toThrow()
  })

  it('com durationMs negativo, tem o mesmo comportamento de duração zero', () => {
    const onFrame = vi.fn()
    animateProgress(-50, onFrame)

    expect(onFrame).toHaveBeenCalledTimes(1)
    expect(onFrame).toHaveBeenCalledWith(1)
  })

  it('interpola quadro a quadro até o progresso completar', () => {
    vi.spyOn(performance, 'now').mockReturnValue(1000)
    const onFrame = vi.fn()
    animateProgress(100, onFrame)

    // Quadro zero, síncrono, antes de qualquer requestAnimationFrame.
    expect(onFrame).toHaveBeenNthCalledWith(1, 0)
    expect(scheduled.size).toBe(1)

    runOldestFrame(1050) // metade do caminho: elapsed 50 de 100
    expect(onFrame).toHaveBeenNthCalledWith(2, easeOutQuart(0.5))
    expect(scheduled.size).toBe(1) // ainda não chegou a 1: agenda o próximo

    runOldestFrame(1100) // elapsed 100 == duration: progresso completo
    expect(onFrame).toHaveBeenNthCalledWith(3, easeOutQuart(1))
    expect(onFrame).toHaveBeenCalledTimes(3)
    expect(scheduled.size).toBe(0) // completo: não agenda mais nada
  })

  it('o cancelador devolvido impede que o próximo quadro agendado rode', () => {
    vi.spyOn(performance, 'now').mockReturnValue(2000)
    const onFrame = vi.fn()
    const cancel = animateProgress(200, onFrame)

    runOldestFrame(2050) // um quadro intermediário, agenda o próximo
    expect(scheduled.size).toBe(1)
    expect(onFrame).toHaveBeenCalledTimes(2)

    cancel()
    expect(scheduled.size).toBe(0) // o quadro pendente foi removido da fila

    // Nenhum novo quadro chega a rodar depois do cancelamento.
    expect(onFrame).toHaveBeenCalledTimes(2)
  })

  it('cancelar um tween que já completou é seguro e não afeta mais nada', () => {
    vi.spyOn(performance, 'now').mockReturnValue(3000)
    const onFrame = vi.fn()
    const cancel = animateProgress(50, onFrame)

    runOldestFrame(3050) // elapsed 50 == duration: completa no primeiro quadro
    expect(onFrame).toHaveBeenCalledTimes(2)
    expect(scheduled.size).toBe(0)

    expect(() => cancel()).not.toThrow()
    expect(onFrame).toHaveBeenCalledTimes(2)
  })
})
