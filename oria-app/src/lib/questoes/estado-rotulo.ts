import type { EstadoTentativa } from '@/lib/api/tipos';

/** Rótulo neutro de processo — nunca "certo"/"errado" (UI_RULES.md, 3.2). */
export const ROTULO_ESTADO: Record<EstadoTentativa | 'pendente', string> = {
  pendente: 'Pendente',
  aberta: 'Em aberto',
  em_passos: 'Em andamento',
  resolvida: 'Concluída',
  abandonada: 'Abandonada',
};
