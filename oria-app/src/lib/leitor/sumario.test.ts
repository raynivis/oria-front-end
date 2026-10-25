import { describe, expect, it } from 'vitest';
import { encontrarCapituloAncestral } from './sumario';
import type { SumarioNo } from '@/lib/api/tipos';

const no = (parcial: Partial<SumarioNo> & { id: string; nivel: number }): SumarioNo => ({
  titulo: parcial.id,
  ordem: 0,
  href: '',
  filhas: [],
  ...parcial,
});

describe('encontrarCapituloAncestral', () => {
  it('acha o capítulo (nível 1) que contém uma subseção de nível 2', () => {
    const sumario: SumarioNo[] = [
      no({
        id: 'cap-3',
        nivel: 1,
        titulo: 'Capítulo 3',
        filhas: [no({ id: 'sec-3-1', nivel: 2, titulo: 'Heurísticas e Vieses' })],
      }),
    ];

    expect(encontrarCapituloAncestral(sumario, 'sec-3-1')).toBe('Capítulo 3');
  });

  it('devolve null quando o sumário é plano e a própria seção já é de nível 1 (livro real ingerido)', () => {
    const sumario: SumarioNo[] = [
      no({ id: 'sec-0', nivel: 1, titulo: 'Nota preliminar' }),
      no({ id: 'sec-1', nivel: 1, titulo: 'Capítulo 1' }),
    ];

    expect(encontrarCapituloAncestral(sumario, 'sec-1')).toBeNull();
  });

  it('devolve null quando o id não existe na árvore', () => {
    const sumario: SumarioNo[] = [no({ id: 'sec-0', nivel: 1, titulo: 'Nota preliminar' })];

    expect(encontrarCapituloAncestral(sumario, 'inexistente')).toBeNull();
  });
});
