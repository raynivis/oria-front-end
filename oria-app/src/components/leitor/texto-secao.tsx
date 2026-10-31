'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { BotaoGerarFichamento } from '@/components/fichamento/botao-gerar-fichamento';
import { usePerguntaTrecho } from '@/lib/chat/contexto-pergunta-trecho';
import { ATALHOS_CHAT } from '@/lib/chat/atalhos';

type Tamanho = 'sm' | 'md' | 'lg';

const CHAVE = 'oria:tamanho-fonte';
const CLASSES: Record<Tamanho, string> = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' };
const RESPOSTAS: Array<{ tamanho: Tamanho; rotulo: string }> = [
  { tamanho: 'sm', rotulo: 'A−' },
  { tamanho: 'md', rotulo: 'A' },
  { tamanho: 'lg', rotulo: 'A+' },
];

type SelecaoAtiva = { trechoCfi: string; trechoTexto: string; topo: number; centroX: number };

/** Índice do parágrafo (`data-indice`) que contém o nó, subindo a árvore a partir dele. */
function acharIndiceDoParagrafo(container: HTMLElement, node: Node): number | null {
  let atual: Node | null = node;
  while (atual && atual !== container) {
    if (atual instanceof HTMLElement && atual.dataset.indice !== undefined) {
      return Number(atual.dataset.indice);
    }
    atual = atual.parentNode;
  }
  return null;
}

/** Deslocamento de (node, offset) em relação ao início do próprio elemento do parágrafo. */
function offsetNoParagrafo(paragrafoEl: HTMLElement, node: Node, offset: number): number {
  const range = document.createRange();
  range.selectNodeContents(paragrafoEl);
  range.setEnd(node, offset);
  return range.toString().length;
}

/** Converte (índice do parágrafo, offset local) num offset global em `texto` (parágrafos separados por "\n\n"). */
function offsetGlobal(paragrafos: string[], indice: number, offsetLocal: number): number {
  let total = 0;
  for (let i = 0; i < indice; i++) total += paragrafos[i].length + 2;
  return total + offsetLocal;
}

export function TextoSecao({ texto, secaoId }: { texto: string; secaoId: string }) {
  const [tamanho, setTamanho] = useState<Tamanho>('md');
  const [selecao, setSelecao] = useState<SelecaoAtiva | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { perguntarSobreTrecho } = usePerguntaTrecho();

  useEffect(() => {
    // localStorage não existe no servidor: só dá para saber depois de montar.
    const salvo = window.localStorage.getItem(CHAVE);
    if (salvo === 'sm' || salvo === 'md' || salvo === 'lg') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTamanho(salvo);
    }
  }, []);

  const paragrafos = texto.split('\n\n');

  useEffect(() => {
    function aoMudarSelecao() {
      const container = containerRef.current;
      const sel = window.getSelection();

      if (!container || !sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelecao(null);
        return;
      }

      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        setSelecao(null);
        return;
      }

      const trechoTexto = sel.toString().trim();
      if (!trechoTexto) {
        setSelecao(null);
        return;
      }

      const indiceInicio = acharIndiceDoParagrafo(container, range.startContainer);
      const indiceFim = acharIndiceDoParagrafo(container, range.endContainer);
      const elInicio = indiceInicio !== null ? container.querySelector<HTMLElement>(`[data-indice="${indiceInicio}"]`) : null;
      const elFim = indiceFim !== null ? container.querySelector<HTMLElement>(`[data-indice="${indiceFim}"]`) : null;

      if (indiceInicio === null || indiceFim === null || !elInicio || !elFim) {
        setSelecao(null);
        return;
      }

      const inicioGlobal = offsetGlobal(paragrafos, indiceInicio, offsetNoParagrafo(elInicio, range.startContainer, range.startOffset));
      const fimGlobal = offsetGlobal(paragrafos, indiceFim, offsetNoParagrafo(elFim, range.endContainer, range.endOffset));
      const retangulo = range.getBoundingClientRect();

      setSelecao({
        trechoCfi: `offset:${inicioGlobal}-${fimGlobal}`,
        trechoTexto,
        topo: retangulo.top,
        centroX: retangulo.left + retangulo.width / 2,
      });
    }

    document.addEventListener('selectionchange', aoMudarSelecao);
    return () => document.removeEventListener('selectionchange', aoMudarSelecao);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  function mudarTamanho(novo: Tamanho) {
    setTamanho(novo);
    window.localStorage.setItem(CHAVE, novo);
  }

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

      <div id="texto-secao" ref={containerRef} className={cn('mx-auto max-w-[68ch]', CLASSES[tamanho])}>
        {paragrafos.map((paragrafo, indice) => (
          <p key={indice} data-indice={indice} className="mb-4 leading-relaxed">
            {paragrafo}
          </p>
        ))}
      </div>

      {selecao && (
        <div
          className="fixed z-50 flex max-w-xs -translate-x-1/2 -translate-y-full flex-col gap-1.5 rounded-md border border-border bg-popover p-2 shadow-lg"
          style={{ top: selecao.topo - 8, left: selecao.centroX }}
        >
          <div className="flex flex-wrap gap-1">
            <BotaoGerarFichamento
              secaoId={secaoId}
              rotulo="Gerar fichamento deste trecho"
              trechoCfi={selecao.trechoCfi}
              trechoTexto={selecao.trechoTexto}
            />
            {ATALHOS_CHAT.map((atalho) => (
              <Button
                key={atalho}
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  perguntarSobreTrecho(selecao.trechoTexto, atalho);
                  setSelecao(null);
                }}
              >
                {atalho}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
