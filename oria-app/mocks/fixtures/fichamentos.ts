import type { FichamentoSaida, FichamentoVersaoSaida } from '@/lib/api/tipos';

/** Fichamento da seção inteira, já com três edições do aluno (versões 2, 3 e 4). */
export const fichamentoSecaoFixture: FichamentoSaida = {
  id: 'fichamento-1',
  sectionId: 'sec-3-1',
  trechoCfi: null,
  numeroVersaoAtual: 4,
  origemVersaoAtual: 'aluno',
  conteudo:
    'Uma heurística é um atalho mental que troca um cálculo complexo por uma estimativa rápida.\n\nNa prática, isso significa que respondo a uma versão mais fácil da pergunta original sem perceber a troca — é o que o texto chama de substituição de perguntas.\n\nO risco é tratar a resposta fácil como se fosse a resposta certa.',
  caracteresIa: 500,
  caracteresAluno: 362,
  proporcaoAluno: 0.42,
  criadoEm: '2026-03-01T14:00:00.000Z',
  atualizadoEm: '2026-03-02T10:30:00.000Z',
};

export const fichamentoVersoesFixture: FichamentoVersaoSaida[] = [
  {
    numero: 1,
    origem: 'ia',
    conteudo:
      'Uma heurística é um atalho mental que troca um cálculo complexo por uma estimativa rápida.\n\nIsso significa que o leitor responde a uma versão mais fácil da pergunta original sem perceber a troca.\n\nO risco é tratar a resposta fácil como se fosse a resposta certa.',
    promptVersao: 3,
    modelo: 'gpt-5-mini',
    criadoEm: '2026-03-01T14:00:00.000Z',
  },
  {
    numero: 2,
    origem: 'aluno',
    conteudo:
      'Uma heurística é um atalho mental que troca um cálculo complexo por uma estimativa rápida.\n\nNa prática, isso significa que respondo a uma versão mais fácil da pergunta original sem perceber a troca.\n\nO risco é tratar a resposta fácil como se fosse a resposta certa.',
    criadoEm: '2026-03-01T18:15:00.000Z',
  },
  {
    numero: 3,
    origem: 'aluno',
    conteudo:
      'Uma heurística é um atalho mental que troca um cálculo complexo por uma estimativa rápida.\n\nNa prática, isso significa que respondo a uma versão mais fácil da pergunta original sem perceber a troca — é o que o texto chama de substituição de perguntas.\n\nO risco é tratar a resposta fácil como se fosse a resposta certa.',
    criadoEm: '2026-03-02T09:00:00.000Z',
  },
  {
    numero: 4,
    origem: 'aluno',
    conteudo: fichamentoSecaoFixture.conteudo,
    criadoEm: '2026-03-02T10:30:00.000Z',
  },
];

/** Ficha de um trecho específico, ainda sem edição do aluno. */
export const fichamentoTrechoFixture: FichamentoSaida = {
  id: 'fichamento-2',
  sectionId: 'sec-3-1',
  trechoCfi: 'offset:120-340',
  numeroVersaoAtual: 1,
  origemVersaoAtual: 'ia',
  conteudo:
    'Este trecho descreve a substituição de perguntas: diante de uma questão difícil, o Sistema 1 responde a uma versão mais fácil sem avisar.',
  caracteresIa: 140,
  caracteresAluno: 0,
  proporcaoAluno: 0,
  criadoEm: '2026-03-03T08:00:00.000Z',
  atualizadoEm: '2026-03-03T08:00:00.000Z',
};

export const fichamentoTrechoVersoesFixture: FichamentoVersaoSaida[] = [
  { numero: 1, origem: 'ia', conteudo: fichamentoTrechoFixture.conteudo, criadoEm: fichamentoTrechoFixture.criadoEm },
];
