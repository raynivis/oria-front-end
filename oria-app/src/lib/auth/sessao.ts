import { NextResponse } from 'next/server';
import type { AutenticacaoSaida } from '@/lib/api/tipos';
import { NOME_COOKIE_TOKEN } from './cookie';

/**
 * Transforma a resposta de login/registro do backend na resposta que o
 * navegador recebe: o token vai para um cookie httpOnly, nunca para o corpo
 * JSON (BACKEND_INTEGRATION.md, seção 2.2).
 */
export function criarRespostaComSessao(dados: AutenticacaoSaida, status: number): NextResponse {
  const resposta = NextResponse.json({ user: dados.user }, { status });
  resposta.cookies.set(NOME_COOKIE_TOKEN, dados.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias — acompanhar JWT_EXPIRES_IN do backend
  });
  return resposta;
}
