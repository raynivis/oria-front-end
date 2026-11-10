import { describe, expect, it } from 'vitest';
import { analisarMarkdown, serializarBlocos, textoDoBloco } from './markdown';

describe('analisarMarkdown', () => {
  it('reconhece título, lista não ordenada e parágrafo (item 2.2)', () => {
    const md = '## Dados citados\n\n- Primeiro item\n- Segundo item\n\nUm parágrafo normal.';
    const blocos = analisarMarkdown(md);

    expect(blocos).toEqual([
      { tipo: 'titulo', nivel: 2, texto: 'Dados citados' },
      { tipo: 'lista', ordenada: false, itens: ['Primeiro item', 'Segundo item'] },
      { tipo: 'paragrafo', texto: 'Um parágrafo normal.' },
    ]);
  });

  it('reconhece lista ordenada com "1." e "2."', () => {
    const md = '1. Primeiro ponto\n2. Segundo ponto';
    const blocos = analisarMarkdown(md);
    expect(blocos).toEqual([{ tipo: 'lista', ordenada: true, itens: ['Primeiro ponto', 'Segundo ponto'] }]);
  });

  it('trata texto sem nenhuma marcação como um único parágrafo', () => {
    const blocos = analisarMarkdown('Fichamento gerado pela IA para a seção inteira.');
    expect(blocos).toEqual([{ tipo: 'paragrafo', texto: 'Fichamento gerado pela IA para a seção inteira.' }]);
  });

  it('não confunde "1." de uma frase comum com item de lista fora de contexto de lista', () => {
    // "1." no meio da frase, não no início da linha — não deve virar lista.
    const blocos = analisarMarkdown('O primeiro ponto (1.1) é importante.');
    expect(blocos).toEqual([{ tipo: 'paragrafo', texto: 'O primeiro ponto (1.1) é importante.' }]);
  });
});

describe('serializarBlocos', () => {
  it('é o inverso de analisarMarkdown para um documento simples', () => {
    const md = '## Título\n\nUm parágrafo.\n\n- item a\n- item b';
    const blocos = analisarMarkdown(md);
    expect(serializarBlocos(blocos)).toBe(md);
  });
});

describe('textoDoBloco', () => {
  it('junta os itens de uma lista para comparação de origem por bloco (UI_RULES.md 4.2)', () => {
    const bloco = { tipo: 'lista' as const, ordenada: false, itens: ['a', 'b'] };
    expect(textoDoBloco(bloco)).toBe('a | b');
  });
});
