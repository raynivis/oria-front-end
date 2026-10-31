import type { Evento, TipoEvento } from '@/lib/api/tipos';

/**
 * Fila de telemetria "fire and forget" (BACKEND_INTEGRATION.md, seção
 * "Telemetria"): acumula em memória, envia em lote a cada ~30s e também
 * quando a aba perde foco. Lote de 1 a 100 eventos. A API é idempotente,
 * então um reenvio depois de falha não duplica — por isso o retry aqui é
 * só "devolver à fila e tentar de novo depois", sem backoff sofisticado.
 */
const TAMANHO_LOTE = 100;
const INTERVALO_MS = 30_000;
const ENDPOINT = '/api/eventos';

let fila: Evento[] = [];
let iniciada = false;
let idIntervalo: number | null = null;
function aoMudarVisibilidade() {
  if (document.visibilityState === 'hidden') void descarregarFila();
}

function criarEvento(tipo: TipoEvento, sectionId?: string, payload?: Record<string, unknown>): Evento {
  return { tipo, sectionId, criadoEm: new Date().toISOString(), payload };
}

export function enfileirarEvento(tipo: TipoEvento, sectionId?: string, payload?: Record<string, unknown>): void {
  fila.push(criarEvento(tipo, sectionId, payload));
  iniciarFila();
}

export async function descarregarFila(): Promise<void> {
  if (fila.length === 0) return;

  const lote = fila.slice(0, TAMANHO_LOTE);
  fila = fila.slice(TAMANHO_LOTE);

  try {
    const resposta = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventos: lote }),
      keepalive: true,
    });
    if (!resposta.ok) fila = [...lote, ...fila];
  } catch {
    fila = [...lote, ...fila];
  }
}

function iniciarFila(): void {
  if (iniciada || typeof window === 'undefined') return;
  iniciada = true;

  idIntervalo = window.setInterval(descarregarFila, INTERVALO_MS);
  document.addEventListener('visibilitychange', aoMudarVisibilidade);
}

/** Exposto só para os testes: reseta o módulo (fila, listener e intervalo) entre casos. */
export function _resetarFilaParaTeste(): void {
  fila = [];
  iniciada = false;
  if (idIntervalo !== null) window.clearInterval(idIntervalo);
  idIntervalo = null;
  document.removeEventListener('visibilitychange', aoMudarVisibilidade);
}
