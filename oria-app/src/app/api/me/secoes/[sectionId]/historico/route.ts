import { NextResponse } from 'next/server';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { HistoricoChatSaida } from '@/lib/api/tipos';

type Contexto = { params: Promise<{ sectionId: string }> };

/**
 * Histórico do chat da seção, unindo todas as sessões do aluno (item 1.8).
 * Paginado por cursor — usado tanto na carga inicial do leitor (server
 * component) quanto em "carregar mais" a partir do cliente.
 */
export async function GET(request: Request, { params }: Contexto) {
  const { sectionId } = await params;
  const parametros = new URL(request.url).searchParams;
  const pagina = parametros.get('pagina');
  const tamanho = parametros.get('tamanho');
  const query = new URLSearchParams();
  if (pagina) query.set('pagina', pagina);
  if (tamanho) query.set('tamanho', tamanho);
  const consulta = query.toString();
  const caminho = `/me/secoes/${sectionId}/historico${consulta ? `?${consulta}` : ''}`;

  try {
    const historico = await chamarApi<HistoricoChatSaida>(caminho);
    return NextResponse.json(historico);
  } catch (erro) {
    if (erro instanceof ErroApiCliente) {
      return NextResponse.json(erro.corpo, { status: erro.statusCode });
    }
    throw erro;
  }
}
