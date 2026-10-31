import { NextResponse } from 'next/server';
import { NOME_COOKIE_TOKEN } from '@/lib/auth/cookie';

/**
 * Único lugar que limpa o cookie ao expirar a sessão (CLAUDE.md, "Armadilhas
 * conhecidas": "qualquer 401 significa sessão expirada: limpe o cookie e
 * redirecione ao login"). Um Server Component não consegue apagar cookie
 * sozinho — só um Route Handler ou Server Action — e pular essa etapa faz o
 * `proxy.ts` ver o cookie velho ainda presente em `/login` e mandar de volta
 * para dentro, num loop de redirecionamento.
 */
export async function GET(request: Request) {
  const resposta = NextResponse.redirect(new URL('/login?sessao=expirada', request.url));
  resposta.cookies.delete(NOME_COOKIE_TOKEN);
  return resposta;
}
