import { NextResponse } from 'next/server';
import { NOME_COOKIE_TOKEN } from '@/lib/auth/cookie';

export async function POST() {
  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.delete(NOME_COOKIE_TOKEN);
  return resposta;
}
