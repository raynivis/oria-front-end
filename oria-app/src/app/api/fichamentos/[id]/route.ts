import { NextResponse } from 'next/server';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { FichamentoSaida } from '@/lib/api/tipos';

type Contexto = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Contexto) {
  const { id } = await params;
  const corpo = (await request.json()) as { conteudo: string };

  try {
    const fichamento = await chamarApi<FichamentoSaida>(`/fichamentos/${id}`, {
      method: 'PATCH',
      corpo,
    });
    return NextResponse.json(fichamento);
  } catch (erro) {
    if (erro instanceof ErroApiCliente) {
      return NextResponse.json(erro.corpo, { status: erro.statusCode });
    }
    throw erro;
  }
}
