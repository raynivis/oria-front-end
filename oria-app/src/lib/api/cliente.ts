import 'server-only';
import { cookies } from 'next/headers';
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
