import type { JSONContent } from '@tiptap/core';
import type { FichamentoVersaoSaida } from '@/lib/api/tipos';
import type { Origem } from '@/components/fichamento/paragrafo-com-origem';

/** Primeira versão de origem "ia" no histórico — a base de comparação (UI_RULES.md, 4.2). */
export function acharVersaoBaseIA(versoes: FichamentoVersaoSaida[]): FichamentoVersaoSaida | null {
  return [...versoes].sort((a, b) => a.numero - b.numero).find((v) => v.origem === 'ia') ?? null;
}

/**
 * Monta o doc inicial do Tiptap a partir do conteúdo atual, marcando como
 * "aluno" todo parágrafo que diverge do mesmo índice na versão-base da IA
 * (ou que não existia nela).
 */
export function montarDocumentoComOrigens(conteudoAtual: string, conteudoBaseIA: string | null): JSONContent {
  const paragrafosAtuais = conteudoAtual.split('\n\n');
  const paragrafosBase = conteudoBaseIA ? conteudoBaseIA.split('\n\n') : [];

  return {
    type: 'doc',
    content: paragrafosAtuais.map((texto, indice) => ({
      type: 'paragraph',
      attrs: { origem: (texto === paragrafosBase[indice] ? 'ia' : 'aluno') as Origem },
      content: texto ? [{ type: 'text', text: texto }] : undefined,
    })),
  };
}

/** Extrai o texto puro de cada parágrafo do editor, na ordem — o formato salvo via PATCH. */
export function extrairParagrafos(documentoEditor: JSONContent): string[] {
  return (documentoEditor.content ?? [])
    .filter((no) => no.type === 'paragraph')
    .map((paragrafo) => (paragrafo.content ?? []).map((filho) => filho.text ?? '').join(''));
}
