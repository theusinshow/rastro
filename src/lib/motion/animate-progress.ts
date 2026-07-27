/** `ease-out-quart` — mesma curva de `--ease-out-quart` em `globals.css`. */
export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4)
}

/**
 * Interpola um progresso de 0 a 1 e entrega cada quadro a quem sabe aplicá-lo.
 *
 * Existe porque o MapLibre ignora `*-transition` em qualquer propriedade de
 * pintura dirigida por dados: o próprio código da biblioteca comenta
 * *"transitions to data-driven properties are not supported"* e salta direto
 * para o valor final. Como a opacidade dos pins depende de `['get', ...]`, a
 * interpolação precisa acontecer fora do renderizador.
 *
 * Não consulta `prefers-reduced-motion`: quem chama decide, porque nem todo
 * movimento daqui deve ser removido — o crossfade dos pins carrega informação e
 * sobrevive à preferência, enquanto o crescimento do anel de seleção não.
 * Passar `durationMs <= 0` entrega o estado final num quadro só.
 *
 * @returns função que cancela a animação em andamento.
 */
export function animateProgress(
  durationMs: number,
  onFrame: (progress: number) => void,
  easing: (t: number) => number = easeOutQuart,
): () => void {
  if (durationMs <= 0 || typeof requestAnimationFrame !== 'function') {
    onFrame(1)
    return () => {}
  }

  const start = performance.now()
  let frame = 0

  function step(now: number) {
    const elapsed = Math.max(0, now - start)
    const linear = Math.min(1, elapsed / durationMs)
    onFrame(easing(linear))
    if (linear < 1) frame = requestAnimationFrame(step)
  }

  onFrame(0)
  frame = requestAnimationFrame(step)

  return () => cancelAnimationFrame(frame)
}
