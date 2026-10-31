export type ErroApi = {
  message: string | string[];
  statusCode: number;
  error?: string;
  timestamp?: string;
  path?: string;
};

export function mensagemDeErro(corpo: ErroApi): string {
  return Array.isArray(corpo.message) ? corpo.message.join(' ') : corpo.message;
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
