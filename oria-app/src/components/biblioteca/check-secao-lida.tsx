'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { lerSecoesAbertas } from '@/lib/telemetria/secoes-abertas';

export function CheckSecaoLida({ secaoId }: { secaoId: string }) {
  const [lida, setLida] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLida(lerSecoesAbertas().includes(secaoId));
  }, [secaoId]);

  if (!lida) return null;
  return <Check aria-label="Seção já aberta" className="inline size-3.5 shrink-0 text-muted-foreground" />;
}
