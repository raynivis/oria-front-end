import type { ConjuntoSaida } from '@/lib/api/tipos';

export const conjuntoFixture: ConjuntoSaida = {
  id: 'conjunto-1',
  sectionId: 'sec-3-1',
  criadoEm: '2026-03-01T10:00:00.000Z',
  questoes: [
    {
      id: 'questao-1',
      ordem: 1,
      enunciado: 'O que é a substituição de perguntas, e por que ela passa despercebida?',
      conceitos: [{ id: 'conceito-substituicao', nome: 'Substituição de perguntas' }],
    },
    {
      id: 'questao-2',
      ordem: 2,
      enunciado: 'Dê um exemplo, com suas palavras, de uma heurística usada no dia a dia.',
      conceitos: [{ id: 'conceito-heuristica', nome: 'Heurística' }],
    },
  ],
};
