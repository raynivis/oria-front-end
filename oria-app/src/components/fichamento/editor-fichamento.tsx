'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Button } from '@/components/ui/button';
import { enfileirarEvento } from '@/lib/telemetria/fila';
import { ParagrafoComOrigem } from './paragrafo-com-origem';
import { acharVersaoBaseIA, extrairParagrafos, montarDocumentoComOrigens } from '@/lib/fichamento/conteudo';
import type { FichamentoSaida, FichamentoVersaoSaida } from '@/lib/api/tipos';

/**
 * Edita o fichamento com Tiptap restrito a parágrafos simples (sem negrito,
 * listas, etc. — o que é salvo é sempre texto puro, parágrafos separados por
 * linha em branco, igual ao `textoCompleto` das seções). A marcação de
 * origem por parágrafo é calculada uma vez ao carregar, contra a primeira
 * versão de origem "ia"; fica correta de novo a cada recarregamento após
 * salvar (UI_RULES.md, seção 4.2).
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

  const versaoBaseIA = acharVersaoBaseIA(versoes);
  const documentoInicial = montarDocumentoComOrigens(fichamento.conteudo, versaoBaseIA?.conteudo ?? null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: false,
        heading: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        listKeymap: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        bold: false,
        italic: false,
        strike: false,
        underline: false,
        link: false,
        hardBreak: false,
      }),
      ParagrafoComOrigem,
    ],
    content: documentoInicial,
    immediatelyRender: false,
    onUpdate: () => setSujo(true),
  });

  async function salvar() {
    if (!editor) return;
    setSalvando(true);
    setErro(null);

    const conteudo = extrairParagrafos(editor.getJSON()).join('\n\n');

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
      router.refresh();
    } catch {
      setErro('Não foi possível salvar agora.');
    } finally {
      setSalvando(false);
    }
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
        className="min-h-40 rounded-md border border-input p-3 text-sm leading-relaxed [&_.tiptap]:outline-none [&_p]:mb-3 [&_p]:border-l-[3px] [&_p]:pl-3 [&_p[data-origem=aluno]]:border-primary [&_p[data-origem=ia]]:border-muted-foreground/50"
      />

      <div className="mt-3 flex items-center justify-end gap-3">
        {erro && <p className="text-sm text-destructive">{erro}</p>}
        <Button onClick={salvar} disabled={!sujo || salvando}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}
