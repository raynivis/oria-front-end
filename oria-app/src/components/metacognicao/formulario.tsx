'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BotaoReporte } from '@/components/reportes/botao';
import { enfileirarEvento } from '@/lib/telemetria/fila';
import type { ErroApi } from '@/lib/api/erros';
import type { MetacognicaoSaida } from '@/lib/api/tipos';

const CONFIANCA_PADRAO = 50;

export function FormularioMetacognicao({
  secaoId,
  temQuestaoConcluida,
}: {
  secaoId: string;
  temQuestaoConcluida: boolean;
}) {
  const [oQueAprendi, setOQueAprendi] = useState('');
  const [oQueDuvido, setOQueDuvido] = useState('');
  const [confianca, setConfianca] = useState(CONFIANCA_PADRAO);
  // Item 3.12: o controle não "começa" num valor — só conta como preenchido
  // depois que o aluno de fato mexeu nele.
  const [confiancaTocada, setConfiancaTocada] = useState(false);
  const [confirmandoSemQuestoes, setConfirmandoSemQuestoes] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<MetacognicaoSaida | null>(null);

  const registrado = resultado !== null;

  async function registrar() {
    setEnviando(true);
    setErro(null);
    try {
      const resposta = await fetch(`/api/secoes/${secaoId}/metacognicao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oQueAprendi, oQueDuvido, confianca }),
      });
      if (!resposta.ok) {
        const corpo = (await resposta.json()) as ErroApi;
        setErro(Array.isArray(corpo.message) ? corpo.message.join(' ') : corpo.message);
        return;
      }
      const dados = (await resposta.json()) as MetacognicaoSaida;
      setResultado(dados);
      enfileirarEvento('registrou_metacognicao', secaoId, { metacognicaoId: dados.id });
    } catch {
      setErro('Não foi possível registrar agora.');
    } finally {
      setEnviando(false);
    }
  }

  function aoClicarRegistrar() {
    // Item 3.1/3.6: o servidor não bloqueia — só confirma antes, sem exame prévio.
    if (!temQuestaoConcluida) {
      setConfirmandoSemQuestoes(true);
      return;
    }
    void registrar();
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="o-que-aprendi" className="text-sm font-medium">
          O que você acredita que aprendeu?
        </label>
        <Textarea
          id="o-que-aprendi"
          value={oQueAprendi}
          onChange={(evento) => setOQueAprendi(evento.target.value)}
          rows={3}
          disabled={registrado || enviando}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="o-que-duvido" className="text-sm font-medium">
          O que ainda gera dúvidas?
        </label>
        <Textarea
          id="o-que-duvido"
          value={oQueDuvido}
          onChange={(evento) => setOQueDuvido(evento.target.value)}
          rows={3}
          disabled={registrado || enviando}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Nível de confiança</p>
          <p className="text-sm text-muted-foreground">{confiancaTocada ? `${confianca}%` : 'Arraste para indicar'}</p>
        </div>
        <Slider
          value={[confianca]}
          onValueChange={(valores) => {
            setConfianca(Array.isArray(valores) ? valores[0] : valores);
            setConfiancaTocada(true);
          }}
          min={0}
          max={100}
          disabled={registrado || enviando}
          aria-label="Nível de confiança"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Inseguro</span>
          <span>Confiante</span>
        </div>
      </div>

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <Button
        type="button"
        onClick={aoClicarRegistrar}
        disabled={registrado || enviando || !oQueAprendi.trim() || !oQueDuvido.trim() || !confiancaTocada}
        className="self-end"
      >
        {registrado ? 'Registrado' : enviando ? 'Registrando…' : 'Registrar'}
      </Button>

      {/*
        Se `sinalizouIlusao` for falso, não mostramos nada aqui — nem uma
        mensagem alternativa (UI_RULES.md, seção 6). A ausência de alerta
        não é elogio.
      */}
      {resultado?.sinalizouIlusao && resultado.observacaoIa && (
        <div className="flex items-start justify-between gap-3 rounded-lg border-l-2 border-amber-500 bg-amber-100 px-4 py-3 text-sm text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
          <p>
            <strong>Possível ilusão de conhecimento:</strong> {resultado.observacaoIa}
          </p>
          <BotaoReporte alvoTipo="metacognicao" alvoId={resultado.id} />
        </div>
      )}

      {/* Item 3.1/3.6: nem elogio nem silêncio quando não há base de comparação — uma confirmação neutra. */}
      {resultado?.semDadosDeComparacao && (
        <div className="rounded-lg border-l-2 border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          Registrado. Ainda não há questões suficientes concluídas nesta seção para comparar com o que você disse
          que aprendeu
          {typeof resultado.questoesFaltando === 'number' && resultado.questoesFaltando > 0
            ? ` — faltam ${resultado.questoesFaltando}.`
            : '.'}
        </div>
      )}

      <Dialog open={confirmandoSemQuestoes} onOpenChange={setConfirmandoSemQuestoes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Você ainda não fez as questões</DialogTitle>
            <DialogDescription>
              Fazer as questões desta seção antes ajuda a comparar o que você acha que aprendeu com o que
              efetivamente demonstrou. Quer fazer agora?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setConfirmandoSemQuestoes(false);
                void registrar();
              }}
            >
              Registrar mesmo assim
            </Button>
            <Button type="button" render={<a href={`/ler/${secaoId}`} />}>
              Fazer agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
