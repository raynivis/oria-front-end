'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { enfileirarEvento } from '@/lib/telemetria/fila';
import { obterTentativaLocal, salvarTentativaLocal } from '@/lib/questoes/tentativa-local';
import { ehRetryable } from '@/lib/api/erros';
import { TrilhaPassos } from './trilha-passos';
import { FormularioPasso } from './formulario-passo';
import type { TentativaSaida } from '@/lib/api/tipos';

type Questao = { id: string; ordem: number; enunciado: string; conceitos: Array<{ id: string; nome: string }> };
type ErroPasso = { mensagem: string; retryable: boolean };

async function lerErro(resposta: Response): Promise<ErroPasso> {
  const corpo = await resposta.json();
  return { mensagem: Array.isArray(corpo.message) ? corpo.message.join(' ') : corpo.message, retryable: ehRetryable(corpo) };
}

/**
 * Os cinco estados de UI_RULES.md, seção 3.1, derivados sempre da resposta
 * da API (nunca computados no cliente): sem tentativa → estado 1; com
 * tentativa, o `passos.at(-1).tipo` (ou `estado === 'resolvida'`) decide o
 * resto. Nenhum desses estados usa cor, ícone ou texto de acerto/erro.
 */
export function CartaoQuestao({
  questao,
  sectionId,
  numeroQuestao,
}: {
  questao: Questao;
  sectionId: string;
  numeroQuestao: number;
}) {
  const [carregando, setCarregando] = useState(true);
  const [tentativa, setTentativa] = useState<TentativaSaida | null>(null);
  const [respostaInicial, setRespostaInicial] = useState<string | null>(null);
  const [campo, setCampo] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<ErroPasso | null>(null);
  const [confirmandoDesistir, setConfirmandoDesistir] = useState(false);

  const idEnunciado = `enunciado-questao-${questao.id}`;

  // Recarregar no meio do fluxo: busca a tentativa lembrada localmente (IMPLEMENTATION.md, Fase 7, critério 5).
  useEffect(() => {
    // localStorage não existe no servidor: só dá para saber depois de montar.
    const local = obterTentativaLocal(questao.id);
    if (!local) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCarregando(false);
      return;
    }
    setRespostaInicial(local.respostaInicial);
    fetch(`/api/tentativas/${local.tentativaId}`)
      .then((resposta) => (resposta.ok ? (resposta.json() as Promise<TentativaSaida>) : null))
      .then((dados) => setTentativa(dados))
      .catch(() => setTentativa(null))
      .finally(() => setCarregando(false));
  }, [questao.id]);

  async function responder() {
    const resposta = campo.trim();
    if (!resposta) return;
    setEnviando(true);
    setErro(null);
    try {
      const resp = await fetch(`/api/questoes/${questao.id}/tentativas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resposta }),
      });
      if (!resp.ok) {
        setErro(await lerErro(resp));
        return;
      }
      const nova = (await resp.json()) as TentativaSaida;
      salvarTentativaLocal(questao.id, { tentativaId: nova.id, respostaInicial: resposta });
      setRespostaInicial(resposta);
      setTentativa(nova);
      setCampo('');
      enfileirarEvento('respondeu', sectionId, { questaoId: questao.id });
    } finally {
      setEnviando(false);
    }
  }

  async function enviarPasso(corpo: { tipo: string; conteudo?: string }) {
    if (!tentativa) return;
    setEnviando(true);
    setErro(null);
    try {
      const resp = await fetch(`/api/tentativas/${tentativa.id}/passos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(corpo),
      });
      if (!resp.ok) {
        setErro(await lerErro(resp));
        return;
      }
      const atualizada = (await resp.json()) as TentativaSaida;
      setTentativa(atualizada);
      setCampo('');
      if (corpo.tipo === 'justificativa_aluno') {
        enfileirarEvento('respondeu', sectionId, { questaoId: questao.id, tentativaId: tentativa.id });
      }
    } finally {
      setEnviando(false);
    }
  }

  async function desistir() {
    if (!tentativa) return;
    setConfirmandoDesistir(false);
    setEnviando(true);
    setErro(null);
    try {
      const resp = await fetch(`/api/tentativas/${tentativa.id}/desistir`, { method: 'POST' });
      if (!resp.ok) {
        setErro(await lerErro(resp));
        return;
      }
      const atualizada = (await resp.json()) as TentativaSaida;
      setTentativa(atualizada);
      enfileirarEvento('desistiu', sectionId, { questaoId: questao.id, tentativaId: tentativa.id });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Card data-testid={`cartao-questao-${questao.id}`}>
      <CardHeader>
        <CardTitle id={idEnunciado} className="text-base font-normal">
          {questao.enunciado}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {carregando ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : !tentativa ? (
          // Estado 1 — questão aberta
          <>
            <Textarea
              aria-label={`Sua resposta à questão ${numeroQuestao}`}
              aria-describedby={idEnunciado}
              value={campo}
              onChange={(evento) => setCampo(evento.target.value)}
              placeholder="Escreva sua resposta…"
              rows={3}
              disabled={enviando}
            />
            {erro && (
              <div className="flex flex-col gap-1">
                <p className="text-sm text-destructive">{erro.mensagem}</p>
                {!erro.retryable && (
                  <p className="text-xs text-muted-foreground">Tentar de novo não vai mudar o resultado — reescreva sua resposta.</p>
                )}
              </div>
            )}
            <Button type="button" onClick={responder} disabled={!campo.trim() || enviando} className="self-end">
              {erro?.retryable ? 'Tentar de novo' : 'Responder'}
            </Button>
          </>
        ) : (
          <>
            {respostaInicial && (
              <div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
                <p className="mb-0.5 text-xs">Sua resposta</p>
                {respostaInicial}
              </div>
            )}

            <TrilhaPassos passos={tentativa.passos} />

            {tentativa.estado === 'resolvida' ? null : tentativa.estado === 'abandonada' ? (
              // Encerrada: campos desabilitados, sem aceitar novos passos (UI_RULES.md, 3.2).
              <p className="text-sm text-muted-foreground">Você desistiu desta questão.</p>
            ) : (
              // Estados 2, 3 e 4 — o que muda é derivado do último passo, dentro de FormularioPasso.
              <FormularioPasso
                tentativa={tentativa}
                sectionId={sectionId}
                numeroQuestao={numeroQuestao}
                idEnunciado={idEnunciado}
                campo={campo}
                setCampo={setCampo}
                enviando={enviando}
                erro={erro}
                onEnviar={() => enviarPasso({ tipo: 'justificativa_aluno', conteudo: campo.trim() })}
                onVerResolucao={() => enviarPasso({ tipo: 'resolucao' })}
                onDesistir={() => setConfirmandoDesistir(true)}
              />
            )}
          </>
        )}
      </CardContent>

      <Dialog open={confirmandoDesistir} onOpenChange={setConfirmandoDesistir}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desistir desta questão?</DialogTitle>
            <DialogDescription>A trilha de passos fica registrada, mas você não poderá continuar respondendo.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirmandoDesistir(false)}>
              Continuar tentando
            </Button>
            <Button type="button" variant="destructive" onClick={desistir}>
              Desistir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
