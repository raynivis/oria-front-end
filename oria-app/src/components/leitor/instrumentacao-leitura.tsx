'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { enfileirarEvento } from '@/lib/telemetria/fila';
import { marcarSecaoAberta } from '@/lib/telemetria/secoes-abertas';
import { marcarUltimaSecao } from '@/lib/telemetria/ultima-secao';

const LIMIAR_ROLAGEM_PX = 40;

/**
 * Dispara `abriu` ao montar, `rolou` na primeira rolagem além do limiar, e
 * `fechou` uma única vez — ao sair da tela (desmontar) ou ao esconder a aba,
 * o que vier primeiro (IMPLEMENTATION.md, Fase 4).
 */
export function InstrumentacaoLeitura({ secaoId, children }: { secaoId: string; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    enfileirarEvento('abriu', secaoId);
    marcarSecaoAberta(secaoId);
    marcarUltimaSecao(secaoId);

    let fechouEnviado = false;
    function enviarFechouUmaVez() {
      if (fechouEnviado) return;
      fechouEnviado = true;
      enfileirarEvento('fechou', secaoId);
    }

    function aoMudarVisibilidade() {
      if (document.visibilityState === 'hidden') enviarFechouUmaVez();
    }

    let rolouEnviado = false;
    function aoRolar() {
      if (rolouEnviado || !ref.current) return;
      if (ref.current.scrollTop > LIMIAR_ROLAGEM_PX) {
        rolouEnviado = true;
        enfileirarEvento('rolou', secaoId);
      }
    }

    const elemento = ref.current;
    document.addEventListener('visibilitychange', aoMudarVisibilidade);
    elemento?.addEventListener('scroll', aoRolar, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', aoMudarVisibilidade);
      elemento?.removeEventListener('scroll', aoRolar);
      enviarFechouUmaVez();
    };
  }, [secaoId]);

  return (
    <main ref={ref} className="flex-1 overflow-y-auto px-6 py-8">
      {children}
    </main>
  );
}
