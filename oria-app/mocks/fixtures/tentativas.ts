import type { TentativaSaida } from '@/lib/api/tipos';

/**
 * Uma fixture por tela do fluxo step-based (UI_RULES.md, seção 3.1), para
 * abrir qualquer uma diretamente sem percorrer o fluxo inteiro:
 * passo 1 (pedido de justificativa) → passo 2 (dica conceitual) →
 * passo 3 (dica localizada, libera "Ver resolução") → resolvida.
 * `tentativaAbandonadaFixture` cobre o quinto caso de encerramento (3.2).
 */

export const tentativaPasso1Fixture: TentativaSaida = {
  id: 'tentativa-passo-1',
  questaoId: 'questao-1',
  estado: 'em_passos',
  nPassos: 1,
  criadaEm: '2026-03-05T10:00:00.000Z',
  encerradaEm: null,
  passos: [
    {
      numero: 1,
      tipo: 'pedido_justificativa',
      conteudo: 'Antes de eu comentar: em que trecho do texto você se apoiou?',
      criadoEm: '2026-03-05T10:00:00.000Z',
    },
  ],
};

export const tentativaPasso2Fixture: TentativaSaida = {
  id: 'tentativa-passo-2',
  questaoId: 'questao-1',
  estado: 'em_passos',
  nPassos: 2,
  criadaEm: '2026-03-05T10:00:00.000Z',
  encerradaEm: null,
  passos: [
    ...tentativaPasso1Fixture.passos,
    {
      numero: 2,
      tipo: 'justificativa_aluno',
      conteudo: 'Me apoiei no trecho que fala que respondemos a uma pergunta mais fácil sem perceber.',
      criadoEm: '2026-03-05T10:02:00.000Z',
    },
    {
      numero: 3,
      tipo: 'dica_conceitual',
      conteudo: 'Pense no mecanismo, não só no efeito: o que exatamente é substituído por quê?',
      criadoEm: '2026-03-05T10:02:05.000Z',
    },
  ],
};

export const tentativaPasso3Fixture: TentativaSaida = {
  id: 'tentativa-passo-3',
  questaoId: 'questao-1',
  estado: 'em_passos',
  nPassos: 3,
  criadaEm: '2026-03-05T10:00:00.000Z',
  encerradaEm: null,
  passos: [
    ...tentativaPasso2Fixture.passos,
    {
      numero: 4,
      tipo: 'justificativa_aluno',
      conteudo: 'A pergunta difícil (probabilidade) é trocada pela pergunta fácil (facilidade de lembrar exemplos).',
      criadoEm: '2026-03-05T10:04:00.000Z',
    },
    {
      numero: 5,
      tipo: 'dica_localizada',
      conteudo: 'Releia o segundo parágrafo de "Substituição de Perguntas" — ele nomeia as duas perguntas envolvidas.',
      criadoEm: '2026-03-05T10:04:05.000Z',
    },
  ],
};

export const tentativaResolvidaFixture: TentativaSaida = {
  id: 'tentativa-resolvida',
  questaoId: 'questao-1',
  estado: 'resolvida',
  nPassos: 4,
  criadaEm: '2026-03-05T10:00:00.000Z',
  encerradaEm: '2026-03-05T10:07:00.000Z',
  passos: [
    ...tentativaPasso3Fixture.passos,
    {
      numero: 6,
      tipo: 'justificativa_aluno',
      conteudo: 'A pergunta original é sobre probabilidade; o Sistema 1 responde à facilidade de lembrar exemplos.',
      criadoEm: '2026-03-05T10:06:00.000Z',
    },
    {
      numero: 7,
      tipo: 'resolucao',
      conteudo:
        'A substituição troca "qual é a probabilidade deste evento" por "quão facilmente me vêm exemplos deste evento à mente", tratando as duas respostas como equivalentes.',
      criadoEm: '2026-03-05T10:07:00.000Z',
    },
  ],
};

export const tentativaAbandonadaFixture: TentativaSaida = {
  id: 'tentativa-abandonada',
  questaoId: 'questao-2',
  estado: 'abandonada',
  nPassos: 1,
  criadaEm: '2026-03-05T11:00:00.000Z',
  encerradaEm: '2026-03-05T11:01:00.000Z',
  passos: [
    {
      numero: 1,
      tipo: 'pedido_justificativa',
      conteudo: 'Antes de eu comentar: em que trecho do texto você se apoiou?',
      criadoEm: '2026-03-05T11:00:00.000Z',
    },
  ],
};

export const tentativasFixture: Record<string, TentativaSaida> = {
  [tentativaPasso1Fixture.id]: tentativaPasso1Fixture,
  [tentativaPasso2Fixture.id]: tentativaPasso2Fixture,
  [tentativaPasso3Fixture.id]: tentativaPasso3Fixture,
  [tentativaResolvidaFixture.id]: tentativaResolvidaFixture,
  [tentativaAbandonadaFixture.id]: tentativaAbandonadaFixture,
};
