import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/api/base-url';
import { NOME_COOKIE_TOKEN } from '@/lib/auth/cookie';

type Contexto = { params: Promise<{ sessaoId: string }> };

/**
 * Repassa o stream de `POST /sessoes/:id/mensagens`. Não usa `chamarApi`
 * porque a resposta é SSE, não JSON — e precisa devolver o `body` como
 * stream, não esperar ele terminar (BACKEND_INTEGRATION.md, seção 5).
 */
export async function POST(request: Request, { params }: Contexto) {
  const { sessaoId } = await params;
  const token = (await cookies()).get(NOME_COOKIE_TOKEN)?.value;
  const corpo = await request.text();

  const resposta = await fetch(`${API_BASE_URL}/sessoes/${sessaoId}/mensagens`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: corpo,
    // Propaga o cancelamento do cliente (aba de rede) até a chamada ao backend.
    signal: request.signal,
  });

  if (!resposta.body) {
    return new Response(null, { status: resposta.status });
  }

  return new Response(resposta.body, {
    status: resposta.status,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
