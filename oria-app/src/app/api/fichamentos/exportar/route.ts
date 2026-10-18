import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/api/base-url';
import { NOME_COOKIE_TOKEN } from '@/lib/auth/cookie';

/**
 * Resposta é texto markdown, não JSON — por isso não usa `chamarApi` (que
 * sempre faz `resposta.json()`). Só markdown existe (UI_RULES.md, 4.4);
 * `?formato=pdf` devolveria 400, então nem expomos essa opção.
 */
export async function GET() {
  const token = (await cookies()).get(NOME_COOKIE_TOKEN)?.value;

  const resposta = await fetch(`${API_BASE_URL}/me/fichamentos/exportar?formato=md`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  const texto = await resposta.text();

  if (!resposta.ok) {
    return new Response(texto, { status: resposta.status, headers: { 'Content-Type': 'application/json' } });
  }

  return new Response(texto, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="fichamentos.md"',
    },
  });
}
