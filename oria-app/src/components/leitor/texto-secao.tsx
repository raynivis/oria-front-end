'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from 'cn';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BotaoGerarFichamento } from '@/components/fichamento/botao-gerar-fichamento';
import { usePerguntaTrecho } from '@/lib/chat/contexto-pergunta-trecho';
import { ATALHOS_CHAT } from '@/lib/chat/atalhos';
import { ancorarTrechoNoTexto, lerTrechoDestacadoDaUrl } from '@/lib/leitor/ancoragem';
import { contarPalavras, expandirParaFrase, expandirParaPalavra } from '@/lib/leitor/selecao';
import { emitirToast } from '@/lib/toast/store';
import type { VocabularioSaida } from '@/lib/api/tipos';
import type { ErroApi } from '@/lib/api/erros';

type Tamanho = 'sm' | 'md' | 'lg';

const CHAVE = 'oria:tamanho-fonte';
const CLASSES: Record<Tamanho, string> = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' };
const RESPOSTAS: Array<{ tamanho: Tamanho; rotulo: string }> = [
  { tamanho: 'sm', rotulo: 'A−' },
  { tamanho: 'md', rotulo: 'A' },
  { tamanho: 'lg', rotulo: 'A+' },
];

type SelecaoAtiva = { inicioGlobal: number; fimGlobal: number; topo: number; centroX: number };

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

/** Índice do parágrafo que contém um offset global. */
function paragrafoDoOffset(paragrafos: string[], offsetGlobalAlvo: number): number {
  let acumulado = 0;
  for (let i = 0; i < paragrafos.length; i++) {
    const fim = acumulado + paragrafos[i].length;
    if (offsetGlobalAlvo <= fim) return i;
    acumulado = fim + 2;
  }
  return paragrafos.length - 1;
}

export function TextoSecao({ texto, secaoId }: { texto: string; secaoId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tamanho, setTamanho] = useState<Tamanho>('md');
  const [selecao, setSelecao] = useState<SelecaoAtiva | null>(null);
  const [vocabulario, setVocabulario] = useState<{ termo: string; carregando: boolean; resultado: VocabularioSaida | null; erro: string | null } | null>(null);
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

  // Chegou aqui com um trecho a destacar vindo de outra seção (item 1.11: clique em citação,
  // "Ver no texto" do fichamento, ou de um chunk mostrado numa dica).
  useEffect(() => {
    const trechoAlvo = lerTrechoDestacadoDaUrl(searchParams);
    if (!trechoAlvo) return;
    const id = window.setTimeout(() => {
      const achou = ancorarTrechoNoTexto(trechoAlvo);
      if (!achou) emitirToast('Não foi possível localizar esse trecho no texto desta seção.', 'erro');
      const url = new URL(window.location.href);
      url.searchParams.delete('destacar');
      router.replace(url.pathname + url.search, { scroll: false });
    }, 50);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    function aoMudarSelecao() {
      const container = containerRef.current;
      const sel = window.getSelection();

      if (!container || !sel || sel.isCollapsed || sel.rangeCount === 0) {
        setSelecao(null);
        setVocabulario(null);
        return;
      }

      const range = sel.getRangeAt(0);
      if (!container.contains(range.commonAncestorContainer)) {
        setSelecao(null);
        return;
      }

      if (!sel.toString().trim()) {
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

      const inicioBruto = offsetGlobal(paragrafos, indiceInicio, offsetNoParagrafo(elInicio, range.startContainer, range.startOffset));
      const fimBruto = offsetGlobal(paragrafos, indiceFim, offsetNoParagrafo(elFim, range.endContainer, range.endOffset));
      // Ajusta à palavra inteira sempre (item 2.3) — nunca corta uma palavra no meio.
      const { inicio, fim } = expandirParaPalavra(texto, Math.min(inicioBruto, fimBruto), Math.max(inicioBruto, fimBruto));
      const retangulo = range.getBoundingClientRect();

      setSelecao({ inicioGlobal: inicio, fimGlobal: fim, topo: retangulo.top, centroX: retangulo.left + retangulo.width / 2 });
      setVocabulario(null);
    }

    document.addEventListener('selectionchange', aoMudarSelecao);
    return () => document.removeEventListener('selectionchange', aoMudarSelecao);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [texto]);

  function mudarTamanho(novo: Tamanho) {
    setTamanho(novo);
    window.localStorage.setItem(CHAVE, novo);
  }

  function irParaParagrafo(indice: number) {
    containerRef.current?.querySelector<HTMLElement>(`[data-indice="${indice}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function deduzirSignificado(trechoTexto: string, indiceParagrafo: number) {
    setVocabulario({ termo: trechoTexto, carregando: true, resultado: null, erro: null });
    try {
      const resposta = await fetch(`/api/secoes/${secaoId}/vocabulario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termo: trechoTexto, trecho: paragrafos[indiceParagrafo] ?? trechoTexto }),
      });
      if (!resposta.ok) {
        const corpo = (await resposta.json()) as ErroApi;
        setVocabulario((atual) => ({
          termo: atual?.termo ?? trechoTexto,
          carregando: false,
          resultado: null,
          erro: Array.isArray(corpo.message) ? corpo.message.join(' ') : corpo.message,
        }));
        return;
      }
      const resultado = (await resposta.json()) as VocabularioSaida;
      setVocabulario((atual) => ({ termo: atual?.termo ?? trechoTexto, carregando: false, resultado, erro: null }));
    } catch {
      setVocabulario((atual) => ({
        termo: atual?.termo ?? trechoTexto,
        carregando: false,
        resultado: null,
        erro: 'Não foi possível buscar ajuda agora.',
      }));
    }
  }

  const trechoTexto = selecao ? texto.slice(selecao.inicioGlobal, selecao.fimGlobal) : '';
  const trechoCfi = selecao ? `offset:${selecao.inicioGlobal}-${selecao.fimGlobal}` : '';
  const ehTermoCurto = selecao ? contarPalavras(trechoTexto) <= 3 : false;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Ir para o parágrafo
          <select
            className="rounded-md border border-input bg-background px-1.5 py-1 text-xs"
            defaultValue=""
            onChange={(evento) => {
              if (evento.target.value) irParaParagrafo(Number(evento.target.value));
              evento.target.value = '';
            }}
            aria-label="Navegar para um parágrafo específico"
          >
            <option value="" disabled>
              Escolher…
            </option>
            {paragrafos.map((_p, indice) => (
              <option key={indice} value={indice}>
                Parágrafo {indice + 1}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-1">
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
          {vocabulario ? (
            <div className="flex max-w-[260px] flex-col gap-1.5 text-sm">
              {vocabulario.carregando && (
                <p className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Buscando pistas…
                </p>
              )}
              {vocabulario.erro && <p className="text-destructive">{vocabulario.erro}</p>}
              {vocabulario.resultado && (
                <>
                  <p className="font-medium">{vocabulario.termo}</p>
                  <p className="text-muted-foreground">{vocabulario.resultado.conteudo}</p>
                </>
              )}
              <Button type="button" size="xs" variant="ghost" className="self-end" onClick={() => setVocabulario(null)}>
                Fechar
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {ehTermoCurto && (
                <Button
                  type="button"
                  variant="default"
                  size="xs"
                  onClick={() => {
                    const indiceParagrafo = paragrafoDoOffset(paragrafos, selecao.inicioGlobal);
                    void deduzirSignificado(trechoTexto, indiceParagrafo);
                  }}
                >
                  Deduzir significado
                </Button>
              )}
              <BotaoGerarFichamento
                secaoId={secaoId}
                rotulo="Gerar fichamento deste trecho"
                trechoCfi={trechoCfi}
                trechoTexto={trechoTexto}
              />
              {ATALHOS_CHAT.map((atalho) => (
                <Button
                  key={atalho}
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => {
                    perguntarSobreTrecho(trechoTexto, atalho);
                    setSelecao(null);
                  }}
                >
                  {atalho}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => {
                  const expandido = expandirParaFrase(texto, selecao.inicioGlobal, selecao.fimGlobal);
                  setSelecao({ ...selecao, inicioGlobal: expandido.inicio, fimGlobal: expandido.fim });
                }}
              >
                Expandir até a frase
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
