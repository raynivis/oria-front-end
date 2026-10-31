import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Intercepta, no processo Node do Next.js, as chamadas que Server
 * Components e Route Handlers fazem à API. Como CLAUDE.md exige que toda
 * chamada à API saia do servidor, mockar aqui cobre o app inteiro — não há
 * necessidade de um worker no navegador.
 */
export const server = setupServer(...handlers);
