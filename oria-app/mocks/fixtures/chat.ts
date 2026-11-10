import type { EventoChat } from '@/lib/api/tipos';

function tokens(frase: string): EventoChat[] {
  return frase.split(' ').map((palavra, indice, lista) => ({
    tipo: 'token',
    texto: indice === lista.length - 1 ? palavra : `${palavra} `,
  }));
}

/** Resposta normal: alguns tokens, duas citações (trechos literais das seções) e fim com base encontrada. */
export const chatSucessoFixture: EventoChat[] = [
  ...tokens(
    'A substituição de perguntas acontece quando o Sistema 1 responde a uma versão mais fácil da pergunta original.',
  ),
  {
    tipo: 'citacao',
    chunkId: 'chunk-1',
    trecho:
      'Quando confrontamos uma questão difícil, mas sem resposta imediata, muitas vezes respondemos a uma questão mais fácil sem notar a substituição.',
    ancoraCfi: 'epubcfi(/6/14!/4/2/2)',
    secaoTitulo: 'Heurísticas e Vieses',
    sectionId: 'sec-3-1',
  },
  {
    // Seção diferente da que normalmente está aberta nos testes (item 1.11): o backend
    // agora busca no livro inteiro antes de recusar, então a citação pode vir de outro lugar.
    tipo: 'citacao',
    chunkId: 'chunk-2',
    trecho: 'O Sistema 1 é especialista em substituir uma pergunta difícil por outra mais fácil, sem que percebamos a troca.',
    ancoraCfi: 'epubcfi(/6/4!/4/2/4)',
    secaoTitulo: 'Sistema 1 e Sistema 2',
    sectionId: 'sec-1-1',
  },
  { tipo: 'fim', messageId: 'mensagem-sucesso-1', encontrouBase: true },
];

/** Recusa: nenhum token de conteúdo, nenhuma citação — `fim` com `encontrouBase: false` e sugestões (item 1.1). */
export const chatRecusaFixture: EventoChat[] = [
  {
    tipo: 'fim',
    messageId: 'mensagem-recusa-1',
    encontrouBase: false,
    sugestoes: [
      { tipo: 'buscar_outras_secoes', descricao: 'Procurar em outras seções do livro' },
      { tipo: 'abrir_glossario', descricao: 'Ver a seção relacionada', sectionId: 'sec-1-1' },
      { tipo: 'inferir_pelo_contexto', descricao: 'Tentar inferir o sentido pelo contexto' },
    ],
  },
];

/** Falha no meio da geração: alguns tokens e depois `erro`, sem `fim`. */
export const chatErroFixture: EventoChat[] = [
  ...tokens('Deixa eu'),
  { tipo: 'erro', mensagem: 'Não foi possível gerar a resposta agora. Tente de novo.' },
];
