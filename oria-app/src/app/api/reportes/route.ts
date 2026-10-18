import { NextResponse } from 'next/server';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { ReporteSaida } from '@/lib/api/tipos';

export async function POST(request: Request) {
  const corpo = await request.json();

  try {
    const reporte = await chamarApi<ReporteSaida>('/reportes', { method: 'POST', corpo });
    return NextResponse.json(reporte, { status: 201 });
  } catch (erro) {
    if (erro instanceof ErroApiCliente) {
      return NextResponse.json(erro.corpo, { status: erro.statusCode });
    }
    throw erro;
  }
}
