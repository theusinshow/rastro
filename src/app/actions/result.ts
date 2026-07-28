/**
 * Resultado de uma Server Action.
 *
 * Recusa vira mensagem em PT-BR, nunca exceção que sobe até uma tela de erro:
 * uma escrita recusada é informação para o usuário, não uma falha do aplicativo.
 */
export type ActionResult = { ok: true } | { ok: false; message: string }
