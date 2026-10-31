import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ErroApiCliente, type ErroApi } from './erros';
import { API_BASE_URL } from './base-url';
import { NOME_COOKIE_TOKEN } from '@/lib/auth/cookie';

type Metodo = 'GET' | 'POST' | 'PATCH' | 'DELETE';

type OpcoesChamada = {
  method?: Metodo;
  corpo?: unknown;
  cache?: RequestCache;
};

/**
 * Único ponto de saída para a API oria-api. Roda em Server Component ou
 * Route Handler, nunca no navegador: lê o cookie httpOnly, monta o header de
 * autenticação e normaliza o erro, conforme CLAUDE.md.
 */
export async function chamarApi<T>(caminho: string, opcoes: OpcoesChamada = {}): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOME_COOKIE_TOKEN)?.value;

  const resposta = await fetch(`${API_BASE_URL}${caminho}`, {
    method: opcoes.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opcoes.corpo !== undefined ? JSON.stringify(opcoes.corpo) : undefined,
    cache: opcoes.cache,
  });

  if (resposta.status === 204) {
    return undefined as T;
  }

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new ErroApiCliente(resposta.status, dados as ErroApi);
  }

  return dados as T;
}

/**
 * Chame no `catch` de toda página que busca dados em Server Component, junto
 * com o tratamento de 404. Sem refresh token, qualquer 401 é sessão expirada
 * (CLAUDE.md, "Armadilhas conhecidas") — redireciona pela rota que limpa o
 * cookie antes (ver `api/auth/sessao-expirada`), nunca direto para `/login`.
 */
export function redirecionarSeSessaoExpirada(erro: unknown): void {
  if (erro instanceof ErroApiCliente && erro.statusCode === 401) {
    redirect('/api/auth/sessao-expirada');
  }
}
