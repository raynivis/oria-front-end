'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { enfileirarEvento } from '@/lib/telemetria/fila';
import { destacarCitacaoNoTexto } from '@/lib/chat/destacar-citacao';
import { usePerguntaTrecho } from '@/lib/chat/contexto-pergunta-trecho';
import { BolhaMensagem } from './bolha-mensagem';
import type { Citacao, Mensagem } from './tipos';
import type { EventoChat } from '@/lib/api/tipos';

const MAXIMO_CITACOES = 3;

export function PainelChat({ sessaoId, secaoId }: { sessaoId: string; secaoId: string }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [rascunho, setRascunho] = useState('');
  const [enviando, setEnviando] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);
  const proximoId = useRef(0);
  const { perguntaPendente, consumirPergunta } = usePerguntaTrecho();
  const ultimoNonceTratado = useRef(0);

  // Cancela o stream em andamento ao sair da tela (UI_RULES.md, 2.2).
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
  }, [mensagens]);

  async function enviarMensagem(conteudoBruto: string) {
    const conteudo = conteudoBruto.trim();
    if (!conteudo || enviando) return;

    setRascunho('');
    setEnviando(true);

    const sequencia = proximoId.current++;
    const idAluno = `aluno-${sequencia}`;
    const idTutora = `tutora-${sequencia}`;
    setMensagens((atual) => [
      ...atual,
      { id: idAluno, papel: 'aluno', conteudo },
      { id: idTutora, papel: 'tutora', conteudo: '', citacoes: [], encontrouBase: null, erro: null, emAndamento: true },
    ]);

    function atualizarTutora(atualizar: (mensagem: Extract<Mensagem, { papel: 'tutora' }>) => Mensagem) {
      setMensagens((atual) =>
        atual.map((m) => (m.id === idTutora && m.papel === 'tutora' ? atualizar(m) : m)),
      );
    }

    const controlador = new AbortController();
    abortRef.current = controlador;

    try {
      const resposta = await fetch(`/api/chat/${sessaoId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo }),
        signal: controlador.signal,
      });

      if (!resposta.ok || !resposta.body) {
        throw new Error('Não foi possível iniciar a resposta.');
      }

      const leitor = resposta.body.getReader();
      const decodificador = new TextDecoder();
      let pendente = '';

      while (true) {
        const { done, value } = await leitor.read();
        if (done) break;

        pendente += decodificador.decode(value, { stream: true });
        const blocos = pendente.split('\n\n');
        pendente = blocos.pop() ?? '';

        for (const bloco of blocos) {
          const linhaEvento = bloco.match(/^event: (.+)$/m)?.[1];
          const linhaDados = bloco.match(/^data: (.+)$/m)?.[1];
          if (!linhaEvento || !linhaDados) continue;

          const evento = { tipo: linhaEvento, ...JSON.parse(linhaDados) } as EventoChat;

          if (evento.tipo === 'token') {
            atualizarTutora((m) => ({ ...m, conteudo: m.conteudo + evento.texto }));
          } else if (evento.tipo === 'citacao') {
            atualizarTutora((m) => (m.citacoes.length >= MAXIMO_CITACOES ? m : { ...m, citacoes: [...m.citacoes, evento] }));
          } else if (evento.tipo === 'fim') {
            atualizarTutora((m) => ({ ...m, encontrouBase: evento.encontrouBase, emAndamento: false }));
          } else if (evento.tipo === 'erro') {
            atualizarTutora((m) => ({ ...m, erro: evento.mensagem, emAndamento: false }));
          }
        }
      }
    } catch (erro) {
      if (erro instanceof DOMException && erro.name === 'AbortError') {
        return; // saiu da tela no meio do stream — cancelamento intencional, não é erro.
      }
      atualizarTutora((m) => ({
        ...m,
        erro: 'Não foi possível gerar a resposta agora. Tente de novo.',
        emAndamento: false,
      }));
    } finally {
      setEnviando(false);
    }
  }

  // Pergunta disparada a partir de um trecho selecionado no texto (`TextoSecao`).
  useEffect(() => {
    if (!perguntaPendente || perguntaPendente.nonce === ultimoNonceTratado.current) return;
    ultimoNonceTratado.current = perguntaPendente.nonce;
    void enviarMensagem(perguntaPendente.mensagem);
    consumirPergunta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perguntaPendente, consumirPergunta]);

  function aoClicarCitacao(citacao: Citacao) {
    enfileirarEvento('clicou_citacao', secaoId, { chunkId: citacao.chunkId });
    destacarCitacaoNoTexto(citacao.trecho);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <p className="text-sm font-medium">Tutora</p>

      <div ref={listaRef} className="flex flex-1 flex-col gap-3 overflow-y-auto">
        {mensagens.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Pergunte algo sobre esta seção, ou selecione um trecho do texto para perguntar sobre ele.
          </p>
        )}
        {mensagens.map((mensagem) => (
          <BolhaMensagem key={mensagem.id} mensagem={mensagem} onClicarCitacao={aoClicarCitacao} />
        ))}
      </div>

      <form
        className="flex items-end gap-2"
        onSubmit={(evento) => {
          evento.preventDefault();
          void enviarMensagem(rascunho);
        }}
      >
        <Textarea
          aria-label="Mensagem para a tutora"
          value={rascunho}
          onChange={(evento) => setRascunho(evento.target.value)}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter' && !evento.shiftKey) {
              evento.preventDefault();
              void enviarMensagem(rascunho);
            }
          }}
          placeholder="Escreva sua mensagem…"
          rows={2}
          disabled={enviando}
          className="min-h-0 resize-none"
        />
        <Button type="submit" size="sm" disabled={enviando || !rascunho.trim()}>
          Enviar
        </Button>
      </form>
    </div>
  );
}
