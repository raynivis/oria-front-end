'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import type { ConjuntoSaida } from '@/lib/api/tipos';
import type { ErroApi } from '@/lib/api/erros';

export function BotaoFazerQuestoes({ secaoId }: { secaoId: string }) {
  const router = useRouter();
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function gerar() {
    setGerando(true);
    setErro(null);
    try {
      const resposta = await fetch(`/api/secoes/${secaoId}/questoes`, { method: 'POST' });
      if (!resposta.ok) {
        const corpo = (await resposta.json()) as ErroApi;
        setErro(Array.isArray(corpo.message) ? corpo.message.join(' ') : corpo.message);
        setGerando(false);
        return;
      }
      const conjunto = (await resposta.json()) as ConjuntoSaida;
      router.push(`/questoes/${conjunto.id}`);
    } catch {
      setErro('Não foi possível gerar as questões agora.');
      setGerando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" size="sm" variant="outline" onClick={gerar} disabled={gerando}>
        {gerando ? 'Gerando…' : 'Fazer questões desta seção'}
      </Button>
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
