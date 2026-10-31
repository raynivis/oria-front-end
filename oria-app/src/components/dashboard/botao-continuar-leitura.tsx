'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { cn } from 'cn';
import { lerUltimaSecao } from '@/lib/telemetria/ultima-secao';

const ESTILO_PADRAO = 'inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline';
const ESTILO_DESTAQUE =
  'inline-flex items-center gap-2 rounded-lg bg-gradient-hero-surface px-4 py-2.5 text-sm font-semibold text-gradient-hero-surface-foreground hover:bg-gradient-hero-surface/90';

/**
 * "Última seção lida" não existe na API — reconstruída no cliente a partir
 * da telemetria (IMPLEMENTATION.md, "Lacunas da API"). Sem nenhuma seção
 * aberta ainda, volta para a biblioteca.
 */
export function BotaoContinuarLeitura({ destaque = false }: { destaque?: boolean }) {
  const [secaoId, setSecaoId] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    // localStorage não existe no servidor: só dá para saber depois de montar.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSecaoId(lerUltimaSecao());
    setPronto(true);
  }, []);

  if (!pronto) return null;

  return (
    <Link href={secaoId ? `/ler/${secaoId}` : '/biblioteca'} className={cn(destaque ? ESTILO_DESTAQUE : ESTILO_PADRAO)}>
      {destaque && <BookOpen className="size-4" />}
      Continuar leitura {!destaque && '→'}
    </Link>
  );
}
