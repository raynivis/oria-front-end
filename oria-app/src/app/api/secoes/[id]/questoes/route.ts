import { NextResponse } from 'next/server';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { ConjuntoSaida } from '@/lib/api/tipos';

type Contexto = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;
  const corpo = await request.json().catch(() => ({}));

  try {
    const conjunto = await chamarApi<ConjuntoSaida>(`/secoes/${id}/questoes`, {
      method: 'POST',
      corpo: Object.keys(corpo).length > 0 ? corpo : undefined,
    });
    return NextResponse.json(conjunto, { status: 201 });
  } catch (erro) {
    if (erro instanceof ErroApiCliente) {
      return NextResponse.json(erro.corpo, { status: erro.statusCode });
    }
    throw erro;
  }
}
