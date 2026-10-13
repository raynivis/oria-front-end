/**
 * Nome do cookie httpOnly que guarda o JWT. Em módulo próprio, sem guarda
 * `server-only`, para poder ser importado também pelo `proxy.ts` (que só
 * verifica a presença do cookie, nunca valida o JWT — isso é tarefa do
 * backend em cada chamada).
 */
export const NOME_COOKIE_TOKEN = 'oria_token';
