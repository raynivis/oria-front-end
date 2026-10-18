import { NextResponse } from 'next/server';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { TentativaSaida } from '@/lib/api/tipos';

type Contexto = { params: Promise<{ id: string }> };

/** Usado ao recarregar a página no meio do fluxo: reconstrói o estado a partir da API. */
export async function GET(_request: Request, { params }: Contexto) {
  const { id } = await params;

  try {
    const tentativa = await chamarApi<TentativaSaida>(`/tentativas/${id}`);
    return NextResponse.json(tentativa);
  } catch (erro) {
    if (erro instanceof ErroApiCliente) {
      return NextResponse.json(erro.corpo, { status: erro.statusCode });
    }
    throw erro;
  }
}
