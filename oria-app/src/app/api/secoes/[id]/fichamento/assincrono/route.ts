import { NextResponse } from 'next/server';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { FichamentoSaida } from '@/lib/api/tipos';

type Contexto = { params: Promise<{ id: string }> };

/**
 * Geração assíncrona (item 2.5): devolve a ficha com `statusGeracao:
 * 'pendente'` e a tela acompanha por GET /fichamentos/:id até ficar
 * 'pronto' — em vez de prender a aba esperando uma chamada síncrona que já
 * passou de 180s numa geração real.
 */
export async function POST(request: Request, { params }: Contexto) {
  const { id } = await params;
  const corpo = (await request.json().catch(() => ({}))) as { trechoCfi?: string; trechoTexto?: string };
  const temTrecho = Boolean(corpo.trechoCfi && corpo.trechoTexto);

  try {
    const fichamento = await chamarApi<FichamentoSaida>(`/secoes/${id}/fichamento/assincrono`, {
      method: 'POST',
      corpo: temTrecho ? { trechoCfi: corpo.trechoCfi, trechoTexto: corpo.trechoTexto } : undefined,
    });
    return NextResponse.json(fichamento, { status: 201 });
  } catch (erro) {
    if (erro instanceof ErroApiCliente) {
      return NextResponse.json(erro.corpo, { status: erro.statusCode });
    }
    throw erro;
  }
}
