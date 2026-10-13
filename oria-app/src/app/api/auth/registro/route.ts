import { NextResponse } from 'next/server';
import type { AutenticacaoSaida } from '@/lib/api/tipos';
import type { ErroApi } from '@/lib/api/erros';
import { API_BASE_URL } from '@/lib/api/base-url';
import { criarRespostaComSessao } from '@/lib/auth/sessao';

export async function POST(request: Request) {
  const corpo = await request.json();

  const resposta = await fetch(`${API_BASE_URL}/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });

  if (!resposta.ok) {
    const erro = (await resposta.json()) as ErroApi;
    return NextResponse.json(erro, { status: resposta.status });
  }

  const dados = (await resposta.json()) as AutenticacaoSaida;
  return criarRespostaComSessao(dados, 201);
}
