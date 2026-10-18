'use client';

import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { ErroApi } from '@/lib/api/erros';

/**
 * Disponível em qualquer tela com conteúdo gerado. `alvoTipo`/`alvoId`
 * identificam a entidade visível na tela — o backend trata como string
 * opaca (BACKEND_INTEGRATION.md, "Metacognição e reportes").
 */
export function BotaoReporte({ alvoTipo, alvoId }: { alvoTipo: string; alvoId: string }) {
  const [aberto, setAberto] = useState(false);
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function aoAbrirOuFechar(valor: boolean) {
    setAberto(valor);
    if (valor) {
      setEnviado(false);
      setErro(null);
      setDescricao('');
    }
  }

  async function enviar() {
    const texto = descricao.trim();
    if (!texto) return;
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch('/api/reportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alvoTipo, alvoId, descricao: texto }),
      });
      if (!resposta.ok) {
        const corpo = (await resposta.json()) as ErroApi;
        setErro(Array.isArray(corpo.message) ? corpo.message.join(' ') : corpo.message);
        return;
      }
      setEnviado(true);
    } catch {
      setErro('Não foi possível enviar o reporte agora.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoAbrirOuFechar}>
      <DialogTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label="Reportar problema" />}>
        <Flag className="size-3.5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reportar problema</DialogTitle>
        </DialogHeader>

        {enviado ? (
          <p className="text-sm text-muted-foreground">Obrigado — o reporte foi enviado.</p>
        ) : (
          <>
            <Textarea
              value={descricao}
              onChange={(evento) => setDescricao(evento.target.value)}
              placeholder="O que está errado aqui?"
              rows={3}
              disabled={enviando}
            />
            {erro && <p className="text-sm text-destructive">{erro}</p>}
            <DialogFooter>
              <Button type="button" onClick={enviar} disabled={!descricao.trim() || enviando}>
                {enviando ? 'Enviando…' : 'Enviar reporte'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
