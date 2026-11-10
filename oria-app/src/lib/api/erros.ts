export type ErroApi = {
  message: string | string[];
  statusCode: number;
  error?: string;
  timestamp?: string;
  path?: string;
  retryable?: boolean;
};

export function mensagemDeErro(corpo: ErroApi): string {
  return Array.isArray(corpo.message) ? corpo.message.join(' ') : corpo.message;
}

/**
 * 503 = falha transitória do LLM (timeout, 429, 5xx) e repetir pode resolver;
 * 502 = 4xx ou schema nunca válido, repetir não muda nada (BACKEND_INTEGRATION.md).
 * Se `retryable` não vier no corpo (API mais antiga), deriva do status.
 */
export function ehRetryable(corpo: ErroApi): boolean {
  return corpo.retryable ?? corpo.statusCode === 503;
}

export class ErroApiCliente extends Error {
  readonly statusCode: number;
  readonly corpo: ErroApi;

  constructor(statusCode: number, corpo: ErroApi) {
    super(mensagemDeErro(corpo));
    this.name = 'ErroApiCliente';
    this.statusCode = statusCode;
    this.corpo = corpo;
  }
}
