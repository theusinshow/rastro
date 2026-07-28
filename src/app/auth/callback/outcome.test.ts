import { describe, expect, it } from 'vitest'
import { readCallbackParams } from './outcome'

function params(query: string): URLSearchParams {
  return new URLSearchParams(query)
}

describe('readCallbackParams', () => {
  it('troca o código e volta para a raiz por padrão', () => {
    expect(readCallbackParams(params('code=abc'))).toEqual({
      kind: 'exchange',
      code: 'abc',
      destination: '/',
    })
  })

  it('preserva o destino pretendido', () => {
    expect(readCallbackParams(params('code=abc&proximo=%2Fviagens'))).toEqual({
      kind: 'exchange',
      code: 'abc',
      destination: '/viagens',
    })
  })

  // Redirecionamento aberto: um `proximo` absoluto mandaria a pessoa para fora
  // logo depois de entrar, com a sessão recém-criada.
  it('recusa destino absoluto e cai na raiz', () => {
    expect(
      readCallbackParams(params('code=abc&proximo=https%3A%2F%2Fevil.com')),
    ).toEqual({ kind: 'exchange', code: 'abc', destination: '/' })
  })

  it('recusa destino protocolo-relativo', () => {
    expect(readCallbackParams(params('code=abc&proximo=%2F%2Fevil.com'))).toEqual(
      { kind: 'exchange', code: 'abc', destination: '/' },
    )
  })

  // O caso que motivou este teste: o provedor devolveu o motivo real da falha e
  // a rota respondia "veio sem o código", descartando a explicação.
  it('carrega a descrição de erro do provedor', () => {
    expect(
      readCallbackParams(
        params(
          'error=server_error&error_code=unexpected_failure&error_description=Unable+to+exchange+external+code',
        ),
      ),
    ).toEqual({
      kind: 'failed',
      reason: 'provedor',
      detail: 'Unable to exchange external code',
    })
  })

  it('cai no código do erro quando não há descrição', () => {
    expect(readCallbackParams(params('error=access_denied'))).toEqual({
      kind: 'failed',
      reason: 'provedor',
      detail: 'access_denied',
    })
  })

  it('sinaliza volta sem código e sem erro', () => {
    expect(readCallbackParams(params(''))).toEqual({
      kind: 'failed',
      reason: 'sem-codigo',
      detail: null,
    })
  })
})
