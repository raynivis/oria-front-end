import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/api/base-url';
import { NOME_COOKIE_TOKEN } from '@/lib/auth/cookie';

type Contexto = { params: Promise<{ id: string }> };

/**
 * Exporta uma única ficha (item 2.9) — resposta é markdown, não JSON, por
 * isso não usa `chamarApi` (mesma razão de `api/fichamentos/exportar`, que
 * exporta todas).
 */
export async function GET(_request: Request, { params }: Contexto) {
  const { id } = await params;
  const token = (await cookies()).get(NOME_COOKIE_TOKEN)?.value;

  const resposta = await fetch(`${API_BASE_URL}/fichamentos/${id}/exportar`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const texto = await resposta.text();

  if (!resposta.ok) {
    return new Response(texto, { status: resposta.status, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(texto, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="fichamento-${id}.md"`,
    },
  });
}
