import type { ConceitoSaida, ConceitosDoAlunoSaida } from '@/lib/api/tipos';

export const conceitosFixture: ConceitoSaida[] = [
  { id: 'conceito-heuristica', nome: 'Heurística', descricaoCurta: 'Atalho mental que troca cálculo por estimativa rápida.' },
  {
    id: 'conceito-substituicao',
    nome: 'Substituição de perguntas',
    descricaoCurta: 'Responder a uma versão mais fácil da pergunta original sem perceber a troca.',
  },
];

export const conceitosDoAlunoFixture: ConceitosDoAlunoSaida = {
  dominados: [
    {
      conceitoId: 'conceito-heuristica',
      nome: 'Heurística',
      sectionId: 'sec-3-1',
      tituloSecao: 'Heurísticas e Vieses',
    },
  ],
  aRevisar: [
    {
      conceitoId: 'conceito-substituicao',
      nome: 'Substituição de perguntas',
      sectionId: 'sec-3-2',
      tituloSecao: 'Substituição de Perguntas',
    },
  ],
};
