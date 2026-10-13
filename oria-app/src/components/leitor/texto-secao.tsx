'use client';

import { useEffect, useState } from 'react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';

type Tamanho = 'sm' | 'md' | 'lg';

const CHAVE = 'oria:tamanho-fonte';
const CLASSES: Record<Tamanho, string> = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' };
const RESPOSTAS: Array<{ tamanho: Tamanho; rotulo: string }> = [
  { tamanho: 'sm', rotulo: 'A−' },
  { tamanho: 'md', rotulo: 'A' },
  { tamanho: 'lg', rotulo: 'A+' },
];

export function TextoSecao({ texto }: { texto: string }) {
  const [tamanho, setTamanho] = useState<Tamanho>('md');

  useEffect(() => {
    // localStorage não existe no servidor: só dá para saber depois de montar.
    const salvo = window.localStorage.getItem(CHAVE);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (salvo === 'sm' || salvo === 'md' || salvo === 'lg') setTamanho(salvo);
  }, []);

  function mudarTamanho(novo: Tamanho) {
    setTamanho(novo);
    window.localStorage.setItem(CHAVE, novo);
  }

  const paragrafos = texto.split('\n\n');

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-1">
        {RESPOSTAS.map(({ tamanho: t, rotulo }) => (
          <Button
            key={t}
            type="button"
            variant={t === tamanho ? 'secondary' : 'ghost'}
            size="icon-sm"
            aria-label={`Tamanho da fonte: ${rotulo}`}
            aria-pressed={t === tamanho}
            onClick={() => mudarTamanho(t)}
          >
            {rotulo}
          </Button>
        ))}
      </div>

      <div className={cn('mx-auto max-w-[68ch]', CLASSES[tamanho])}>
        {paragrafos.map((paragrafo, indice) => (
          <p key={indice} className="mb-4 leading-relaxed">
            {paragrafo}
          </p>
        ))}
      </div>
    </div>
  );
}
