import type { SumarioNo } from '@/lib/api/tipos';

/**
 * Três capítulos, duas subseções cada — a árvore que alimenta a biblioteca,
 * o sumário e o leitor nos mocks. Os ids das subseções (nível 2) são os
 * mesmos usados em `secoes.ts`.
 */
export const sumarioFixture: SumarioNo[] = [
  {
    id: 'cap-1',
    titulo: 'Capítulo 1',
    nivel: 1,
    ordem: 1,
    href: '/ler/sec-1-1',
    filhas: [
      { id: 'sec-1-1', titulo: 'Sistema 1 e Sistema 2', nivel: 2, ordem: 1, href: '/ler/sec-1-1', filhas: [] },
      { id: 'sec-1-2', titulo: 'O Papel da Intuição', nivel: 2, ordem: 2, href: '/ler/sec-1-2', filhas: [] },
    ],
  },
  {
    id: 'cap-2',
    titulo: 'Capítulo 2',
    nivel: 1,
    ordem: 2,
    href: '/ler/sec-2-1',
    filhas: [
      { id: 'sec-2-1', titulo: 'O que Conta como Prova', nivel: 2, ordem: 1, href: '/ler/sec-2-1', filhas: [] },
      { id: 'sec-2-2', titulo: 'Vieses de Confirmação', nivel: 2, ordem: 2, href: '/ler/sec-2-2', filhas: [] },
    ],
  },
  {
    id: 'cap-3',
    titulo: 'Capítulo 3',
    nivel: 1,
    ordem: 3,
    href: '/ler/sec-3-1',
    filhas: [
      { id: 'sec-3-1', titulo: 'Heurísticas e Vieses', nivel: 2, ordem: 1, href: '/ler/sec-3-1', filhas: [] },
      { id: 'sec-3-2', titulo: 'Substituição de Perguntas', nivel: 2, ordem: 2, href: '/ler/sec-3-2', filhas: [] },
    ],
  },
];
