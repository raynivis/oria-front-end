'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { enfileirarEvento } from '@/lib/telemetria/fila';
import { OrigemExtension } from './paragrafo-com-origem';
import { acharVersaoBaseIA, extrairMarkdown, montarDocumentoComOrigens } from '@/lib/fichamento/conteudo';
import type { FichamentoSaida, FichamentoVersaoSaida } from '@/lib/api/tipos';

const ATRASO_AUTOSAVE_MS = 2500;

/**
 * Edita o fichamento com Tiptap, restrito a título, lista e parágrafo — o
 * que o prompt de fichamento de fato produz (## título, listas, parágrafos;
 * item 2.2 da correção de usabilidade). O que é salvo é sempre markdown,
 * igual ao `textoCompleto` das seções. A marcação de origem por bloco é
 * calculada uma vez ao carregar, contra a primeira versão de origem "ia";
 * fica correta de novo a cada recarregamento após salvar (UI_RULES.md, 4.2).
 *
 * Salva sozinho, com um pequeno atraso após parar de digitar (item 2.7):
 * mais robusto que interceptar a navegação, e o horário do último
 * salvamento fica sempre visível.
 */
export function EditorFichamento({
  fichamento,
  versoes,
}: {
  fichamento: FichamentoSaida;
  versoes: FichamentoVersaoSaida[];
}) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sujo, setSujo] = useState(false);
  const [salvoAs, setSalvoAs] = useState<Date | null>(null);
  const timerAutosave = useRef<ReturnType<typeof setTimeout> | null>(null);

  const versaoBaseIA = acharVersaoBaseIA(versoes);
  const documentoInicial = montarDocumentoComOrigens(fichamento.conteudo, versaoBaseIA?.conteudo ?? null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
        strike: false,
        underline: false,
        link: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        hardBreak: false,
      }),
      OrigemExtension,
    ],
    content: documentoInicial,
    immediatelyRender: false,
    onUpdate: () => {
      setSujo(true);
      if (timerAutosave.current) clearTimeout(timerAutosave.current);
      timerAutosave.current = setTimeout(() => void salvar(), ATRASO_AUTOSAVE_MS);
    },
  });

  useEffect(() => {
    return () => {
      if (timerAutosave.current) clearTimeout(timerAutosave.current);
    };
  }, []);

  async function salvar() {
    if (!editor) return;
    setSalvando(true);
    setErro(null);

    const conteudo = extrairMarkdown(editor.getJSON());

    try {
      const resposta = await fetch(`/api/fichamentos/${fichamento.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conteudo }),
      });

      if (!resposta.ok) {
        const corpo = await resposta.json();
        setErro(corpo.message ?? 'Não foi possível salvar.');
        return;
      }

      enfileirarEvento('editou_fichamento', fichamento.sectionId, { fichamentoId: fichamento.id });
      setSujo(false);
      setSalvoAs(new Date());
      router.refresh();
    } catch {
      setErro('Não foi possível salvar agora.');
    } finally {
      setSalvando(false);
    }
  }

  function salvarAgora() {
    if (timerAutosave.current) clearTimeout(timerAutosave.current);
    void salvar();
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-3.5 w-[3px] rounded-full bg-muted-foreground/50" />
          Texto gerado pela IA
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-3.5 w-[3px] rounded-full bg-primary" />
          Texto escrito ou reescrito por você
        </span>
      </div>

      <EditorContent
        editor={editor}
        className="min-h-40 rounded-md border border-input p-3 text-sm leading-relaxed [&_.tiptap]:outline-none [&_h1,&_h2,&_h3,&_h4,&_h5,&_h6]:mb-2 [&_h1,&_h2,&_h3,&_h4,&_h5,&_h6]:mt-3 [&_h1,&_h2,&_h3,&_h4,&_h5,&_h6]:font-semibold [&_li]:border-l-[3px] [&_li]:pl-2 [&_li[data-origem=aluno]]:border-primary [&_li[data-origem=ia]]:border-muted-foreground/50 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_p]:border-l-[3px] [&_p]:pl-3 [&_p[data-origem=aluno]]:border-primary [&_p[data-origem=ia]]:border-muted-foreground/50 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {salvando
            ? 'Salvando…'
            : salvoAs
              ? `Salvo às ${salvoAs.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : sujo
                ? 'Alterações não salvas'
                : ''}
        </p>
        <div className="flex items-center gap-3">
          {erro && <p className="text-sm text-destructive">{erro}</p>}
          <Button onClick={salvarAgora} disabled={!sujo || salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
