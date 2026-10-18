import { NextResponse } from 'next/server';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { MetacognicaoSaida } from '@/lib/api/tipos';

type Contexto = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;
  const corpo = await request.json();

  try {
    const metacognicao = await chamarApi<MetacognicaoSaida>(`/secoes/${id}/metacognicao`, {
      method: 'POST',
      corpo,
    });
    return NextResponse.json(metacognicao, { status: 201 });
  } catch (erro) {
    if (erro instanceof ErroApiCliente) {
      return NextResponse.json(erro.corpo, { status: erro.statusCode });
    }
    throw erro;
  }
}
