import { Node, mergeAttributes } from '@tiptap/core';

export type Origem = 'ia' | 'aluno';

/**
 * Substitui o Paragraph padrão do StarterKit só para carregar um atributo
 * `origem` ('ia' | 'aluno'), usado pela marcação visual por parágrafo
 * (UI_RULES.md, seção 4.2). O atributo é calculado uma vez, ao montar o
 * editor com o conteúdo vindo do servidor — não é recalculado a cada tecla.
 */
export const ParagrafoComOrigem = Node.create({
  name: 'paragraph',
  group: 'block',
  content: 'inline*',

  addAttributes() {
    return {
      origem: {
        default: 'ia' as Origem,
        parseHTML: (elemento) => elemento.getAttribute('data-origem') ?? 'ia',
        renderHTML: (atributos) => ({ 'data-origem': atributos.origem }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'p' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes), 0];
  },
});
