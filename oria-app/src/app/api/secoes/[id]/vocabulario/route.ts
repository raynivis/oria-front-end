import { NextResponse } from 'next/server';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { VocabularioSaida } from '@/lib/api/tipos';

type Contexto = { params: Promise<{ id: string }> };

/** Atalho de dedução de termo (item 1.9) — endpoint próprio, não é o diálogo. */
export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;
  const corpo = (await request.json()) as { termo: string; trecho: string };

  try {
    const resultado = await chamarApi<VocabularioSaida>(`/secoes/${id}/vocabulario`, {
      method: 'POST',
      corpo,
    });
    return NextResponse.json(resultado);
  } catch (erro) {
    if (erro instanceof ErroApiCliente) {
      return NextResponse.json(erro.corpo, { status: erro.statusCode });
    }
    throw erro;
  }
}
