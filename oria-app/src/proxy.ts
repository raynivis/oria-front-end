import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { NOME_COOKIE_TOKEN } from '@/lib/auth/cookie';

const ROTAS_PUBLICAS = ['/login', '/registro'];

/**
 * Só verifica a presença do cookie — nunca valida o JWT aqui. O backend
 * valida em cada chamada, e um 401 de qualquer rota já dispara o mesmo
 * redirecionamento ao login (CLAUDE.md, "Armadilhas conhecidas").
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const temSessao = request.cookies.has(NOME_COOKIE_TOKEN);

  if (ROTAS_PUBLICAS.includes(pathname)) {
    return temSessao ? NextResponse.redirect(new URL('/', request.url)) : NextResponse.next();
  }

  if (!temSessao) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
