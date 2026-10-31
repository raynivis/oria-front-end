import { NextResponse } from 'next/server';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { Evento } from '@/lib/api/tipos';

export async function POST(request: Request) {
  const corpo = (await request.json()) as { eventos: Evento[] };

  try {
    const dados = await chamarApi<{ recebidos: number; gravados: number }>('/eventos', {
      method: 'POST',
      corpo,
    });
    return NextResponse.json(dados);
  } catch (erro) {
    if (erro instanceof ErroApiCliente) {
      return NextResponse.json(erro.corpo, { status: erro.statusCode });
    }
    throw erro;
  }
}
