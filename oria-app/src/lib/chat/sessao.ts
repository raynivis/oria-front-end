import 'server-only';
import { chamarApi } from '@/lib/api/cliente';
import type { SessaoResumo, SessaoSaida } from '@/lib/api/tipos';

/**
 * "Uma sessão é sempre presa a uma seção" (BACKEND_INTEGRATION.md, seção 4) —
 * reaproveita a sessão existente da seção em vez de criar uma nova a cada
 * visita ao leitor.
 */
export async function obterOuCriarSessao(secaoId: string): Promise<SessaoSaida> {
  const resumos = await chamarApi<SessaoResumo[]>('/me/sessoes');
  const existente = resumos.find((sessao) => sessao.sectionId === secaoId);

  if (existente) {
    return chamarApi<SessaoSaida>(`/sessoes/${existente.id}`);
  }

  return chamarApi<SessaoSaida>('/sessoes', { method: 'POST', corpo: { secaoId } });
}
