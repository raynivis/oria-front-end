'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { enfileirarEvento } from '@/lib/telemetria/fila';
import type { FichamentoSaida } from '@/lib/api/tipos';
import type { ErroApi } from '@/lib/api/erros';

type Props = {
  secaoId: string;
  rotulo: string;
  trechoCfi?: string;
  trechoTexto?: string;
  size?: 'default' | 'sm';
};

/** Serve as duas entradas de geração (UI_RULES.md, 4.1): seção inteira (sem trecho*) ou trecho selecionado. */
export function BotaoGerarFichamento({ secaoId, rotulo, trechoCfi, trechoTexto, size = 'sm' }: Props) {
  const router = useRouter();
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function gerar() {
    setGerando(true);
    setErro(null);

    try {
      const resposta = await fetch(`/api/secoes/${secaoId}/fichamento`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trechoCfi && trechoTexto ? { trechoCfi, trechoTexto } : {}),
      });

      if (!resposta.ok) {
        const corpo = (await resposta.json()) as ErroApi;
        setErro(Array.isArray(corpo.message) ? corpo.message.join(' ') : corpo.message);
        setGerando(false);
        return;
      }

      const fichamento = (await resposta.json()) as FichamentoSaida;
      enfileirarEvento('gerou_fichamento', secaoId, { fichamentoId: fichamento.id, trecho: Boolean(trechoCfi) });
      router.push(`/fichamentos/${fichamento.id}`);
    } catch {
      setErro('Não foi possível gerar o fichamento agora.');
      setGerando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" size={size} variant="outline" onClick={gerar} disabled={gerando}>
        {gerando ? 'Gerando…' : rotulo}
      </Button>
      {erro && <p className="text-xs text-destructive">{erro}</p>}
    </div>
  );
}
