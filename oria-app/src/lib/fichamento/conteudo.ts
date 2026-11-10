import type { JSONContent } from '@tiptap/core';
import type { FichamentoVersaoSaida } from '@/lib/api/tipos';
import type { Origem } from '@/components/fichamento/paragrafo-com-origem';
import { analisarMarkdown, textoDoBloco, type BlocoFichamento } from './markdown';

/** Primeira versão de origem "ia" no histórico — a base de comparação (UI_RULES.md, 4.2). */
export function acharVersaoBaseIA(versoes: FichamentoVersaoSaida[]): FichamentoVersaoSaida | null {
  return [...versoes].sort((a, b) => a.numero - b.numero).find((v) => v.origem === 'ia') ?? null;
}

function blocoParaTiptap(bloco: BlocoFichamento, origemBloco: Origem): JSONContent {
  if (bloco.tipo === 'titulo') {
    return {
      type: 'heading',
      attrs: { level: Math.min(bloco.nivel, 6), origem: origemBloco },
      content: bloco.texto ? [{ type: 'text', text: bloco.texto }] : undefined,
    };
  }
  if (bloco.tipo === 'lista') {
    return {
      type: bloco.ordenada ? 'orderedList' : 'bulletList',
      content: bloco.itens.map((item) => ({
        type: 'listItem',
        attrs: { origem: origemBloco },
        content: [{ type: 'paragraph', content: item ? [{ type: 'text', text: item }] : undefined }],
      })),
    };
  }
  return {
    type: 'paragraph',
    attrs: { origem: origemBloco },
    content: bloco.texto ? [{ type: 'text', text: bloco.texto }] : undefined,
  };
}

/**
 * Monta o doc inicial do Tiptap a partir do markdown atual, marcando como
 * "aluno" todo bloco que diverge do bloco de mesmo índice na versão-base da
 * IA (ou que não existia nela). Bloco = título, item de lista ou parágrafo —
 * a granularidade da marcação de origem (UI_RULES.md, 4.2).
 */
export function montarDocumentoComOrigens(conteudoAtual: string, conteudoBaseIA: string | null): JSONContent {
  const blocosAtuais = analisarMarkdown(conteudoAtual);
  const blocosBase = conteudoBaseIA ? analisarMarkdown(conteudoBaseIA) : [];
  const textosBase = blocosBase.map(textoDoBloco);

  return {
    type: 'doc',
    content: blocosAtuais.map((bloco, indice) => {
      const origemBloco: Origem = textoDoBloco(bloco) === textosBase[indice] ? 'ia' : 'aluno';
      return blocoParaTiptap(bloco, origemBloco);
    }),
  };
}

/** Extrai o markdown de volta a partir do documento do editor — o formato salvo via PATCH. */
export function extrairMarkdown(documentoEditor: JSONContent): string {
  const linhas: string[] = [];

  function textoDoNo(no: JSONContent): string {
    return (no.content ?? []).map((filho) => filho.text ?? '').join('');
  }

  for (const no of documentoEditor.content ?? []) {
    if (no.type === 'heading') {
      const nivel = (no.attrs?.level as number) ?? 1;
      linhas.push(`${'#'.repeat(nivel)} ${textoDoNo(no)}`.trim());
    } else if (no.type === 'bulletList' || no.type === 'orderedList') {
      const ordenada = no.type === 'orderedList';
      const itens = (no.content ?? []).map((item) => {
        const paragrafo = item.content?.find((filho) => filho.type === 'paragraph');
        return paragrafo ? textoDoNo(paragrafo) : '';
      });
      linhas.push(itens.map((item, indice) => (ordenada ? `${indice + 1}. ${item}` : `- ${item}`)).join('\n'));
    } else if (no.type === 'paragraph') {
      linhas.push(textoDoNo(no));
    }
  }

  return linhas.join('\n\n');
}
