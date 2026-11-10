import { Extension } from '@tiptap/core';

export type Origem = 'ia' | 'aluno';

/**
 * Acrescenta o atributo `origem` ('ia' | 'aluno') a parágrafo, título e item
 * de lista — os três tipos de bloco que o fichamento pode ter (item 2.2 da
 * correção de usabilidade). Usado pela marcação visual por bloco
 * (UI_RULES.md, seção 4.2): calculado uma vez ao montar o editor com o
 * conteúdo vindo do servidor, não recalculado a cada tecla.
 */
export const OrigemExtension = Extension.create({
  name: 'origemAttrs',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading', 'listItem'],
        attributes: {
          origem: {
            default: 'ia' as Origem,
            parseHTML: (elemento) => elemento.getAttribute('data-origem') ?? 'ia',
            renderHTML: (atributos) => ({ 'data-origem': atributos.origem }),
          },
        },
      },
    ];
  },
});
