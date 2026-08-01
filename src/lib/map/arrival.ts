/**
 * O bilhete que o sobrevoo deixa para o app.
 *
 * Uma variável de módulo basta — e só basta porque o mapa passou a viver no
 * layout raiz (ADR 0018). Antes disso, entrar significava uma navegação que
 * destruía o mapa e o contexto de JavaScript junto, e um bilhete guardado aqui
 * teria sumido no caminho. Hoje a entrada e o app são o mesmo contexto, então o
 * sinal atravessa sem cookie, sem parâmetro na URL e sem estado global.
 *
 * É consumido UMA vez: navegar entre Explorar e Viagens depois de entrar não
 * deve mexer na câmera de novo.
 */
let arrived = false

export function markArrival(): void {
  arrived = true
}

export function consumeArrival(): boolean {
  const pending = arrived
  arrived = false
  return pending
}
