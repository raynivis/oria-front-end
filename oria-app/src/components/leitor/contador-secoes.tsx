'use client';

import { useEffect, useState } from 'react';
import type { SumarioNo } from '@/lib/api/tipos';
import { lerSecoesAbertas } from '@/lib/telemetria/secoes-abertas';

function folhasDoSumario(nos: SumarioNo[]): string[] {
  return nos.flatMap((no) => (no.filhas.length === 0 ? [no.id] : folhasDoSumario(no.filhas)));
}

/**
 * "3 de 6 seções lidas" (UI_RULES.md, seção 1.4) — nunca percentual. O total
 * vem do sumário já carregado; quantas foram abertas só existe no cliente
 * (ver lib/telemetria/secoes-abertas.ts), por isso o valor chega depois da
 * primeira pintura.
 */
export function ContadorSecoes({ sumario }: { sumario: SumarioNo[] }) {
  const folhas = folhasDoSumario(sumario);
  const [abertas, setAbertas] = useState<number | null>(null);

  useEffect(() => {
    const lidas = lerSecoesAbertas();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAbertas(folhas.filter((id) => lidas.includes(id)).length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sumario]);

  if (abertas === null) return null;

  return (
    <p className="text-sm text-muted-foreground">
      {abertas} de {folhas.length} seções lidas
    </p>
  );
}
