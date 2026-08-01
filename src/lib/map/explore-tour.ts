/**
 * O passeio do mapa já foi dispensado nesta sessão?
 *
 * Uma variável de módulo, como `arrival.ts` — e pelo mesmo motivo: desde o ADR
 * 0018 a entrada e o aplicativo são o mesmo contexto de JavaScript, então o
 * sinal atravessa a navegação sem cookie, sem parâmetro na URL e sem estado
 * global.
 *
 * **O que dispensa é qualquer gesto**, e não a passagem do tempo: um toque, um
 * arrasto, uma rolagem, uma tecla. A partir daí o mapa é seu até recarregar a
 * página. É por isso que voltar de Viagens para Explorar não recomeça o passeio
 * — para navegar até Viagens a pessoa clicou em alguma coisa, e aquele clique
 * já o dispensou.
 *
 * Isso também é o que mantém a decisão honesta: o passeio só acontece quando a
 * pessoa literalmente não tocou em nada desde que a página abriu.
 */
let dismissed = false

export function isExploreTourDismissed(): boolean {
  return dismissed
}

export function dismissExploreTour(): void {
  dismissed = true
}

/** Uso exclusivo de teste: módulo sobrevive entre casos. */
export function __resetExploreTour(): void {
  dismissed = false
}
