'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import { emitirToast } from '@/lib/toast/store';
import { CabecalhoFicha } from './cabecalho-ficha';
import { EditorFichamento } from './editor-fichamento';
import { HistoricoVersoes } from './historico-versoes';
import type { FichamentoSaida, FichamentoVersaoSaida } from '@/lib/api/tipos';

const INTERVALO_POLL_MS = 2500;

/**
 * Acompanha a geração assíncrona do fichamento (item 2.5): enquanto
 * `statusGeracao === 'pendente'`, faz poll de `GET /fichamentos/:id` em vez
 * de prender a aba numa chamada síncrona — uma geração real já passou de
 * 180s. Some API mais antiga, sem o campo, cai direto no conteúdo (nunca
 * fica pendente). Quando passa a 'pronto', avisa por toast.
 *
 * Importante: este componente é dono do `fichamento`/`versoes` que renderiza
 * — não depende de `router.refresh()` entregar props novas do servidor a
 * tempo. Um `router.refresh()` chamado no meio da transição corre contra o
 * próprio estado local (o "gate" de pendente→pronto abre antes do RSC
 * atualizado chegar), e isso já produziu uma tela com o editor vazio em
 * teste. As versões ainda não existem enquanto pendente; ao ficar pronto,
 * a primeira versão é sempre a gerada pela IA, então é montada localmente a
 * partir do próprio `conteudo` em vez de depender de uma segunda chamada.
 */
export function AcompanharGeracao({
  fichamentoInicial,
  versoesIniciais,
}: {
  fichamentoInicial: FichamentoSaida;
  versoesIniciais: FichamentoVersaoSaida[];
}) {
  const router = useRouter();
  const [fichamento, setFichamento] = useState(fichamentoInicial);
  const [versoes, setVersoes] = useState(versoesIniciais);
  const avisouPronto = useRef(fichamentoInicial.statusGeracao !== 'pendente');

  useEffect(() => {
    if (fichamento.statusGeracao !== 'pendente') return;

    const intervalo = setInterval(() => {
      fetch(`/api/fichamentos/${fichamento.id}`)
        .then((resposta) => (resposta.ok ? (resposta.json() as Promise<FichamentoSaida>) : null))
        .then((atualizado) => {
          if (!atualizado) return;
          setFichamento(atualizado);
          if (atualizado.statusGeracao === 'pronto' && !avisouPronto.current) {
            avisouPronto.current = true;
            setVersoes([{ numero: 1, origem: 'ia', conteudo: atualizado.conteudo, criadoEm: atualizado.criadoEm }]);
            emitirToast('Fichamento pronto.', 'sucesso');
            router.refresh();
          }
        })
        .catch(() => {
          // Falha pontual de rede no poll: tenta de novo no próximo intervalo.
        });
    }, INTERVALO_POLL_MS);

    return () => clearInterval(intervalo);
  }, [fichamento.id, fichamento.statusGeracao, router]);

  if (fichamento.statusGeracao === 'pendente') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border py-16 text-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
        <p className="text-sm font-medium">Gerando fichamento…</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Pode levar até três minutos na primeira vez. Esta página atualiza sozinha quando terminar — não precisa recarregar.
        </p>
      </div>
    );
  }

  if (fichamento.statusGeracao === 'erro') {
    return (
      <div className="flex items-start gap-2 rounded-lg border-l-2 border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>{fichamento.erroMensagem ?? 'Não foi possível gerar este fichamento.'}</p>
      </div>
    );
  }

  return (
    <>
      <CabecalhoFicha fichamento={fichamento} />
      <EditorFichamento fichamento={fichamento} versoes={versoes} />
      <HistoricoVersoes versoes={versoes} />
    </>
  );
}
