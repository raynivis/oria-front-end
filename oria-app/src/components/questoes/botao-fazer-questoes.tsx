'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
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
        {gerando && <Loader2 className="animate-spin" />}
        {gerando ? 'Gerando…' : 'Fazer questões desta seção'}
      </Button>
      {gerando && (
        <p className="text-xs text-muted-foreground">
          Pode levar até um minuto e meio na primeira vez — depois fica salvo.
        </p>
      )}
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
