import { http, HttpResponse } from 'msw';
import type {
  ConjuntoSaida,
  FichamentoSaida,
  FichamentoVersaoSaida,
  SessaoSaida,
  TentativaSaida,
} from '@/lib/api/tipos';
import { API_BASE_URL } from '@/lib/api/base-url';
import { autenticar, buscarUsuarioPorToken, registrar } from './fixtures/auth';
import { livrosFixture } from './fixtures/livros';
import { sumarioFixture } from './fixtures/sumario';
import { secoesFixture } from './fixtures/secoes';
import { panoramaFixturePara } from './fixtures/panorama';
import {
  fichamentoSecaoFixture,
  fichamentoTrechoFixture,
  fichamentoVersoesFixture,
  fichamentosDoAlunoFixture,
} from './fixtures/fichamentos';
import { conceitosFixture, conceitosDoAlunoFixture } from './fixtures/conceitos';
import { conjuntoFixture } from './fixtures/questoes';
import { tentativaPasso1Fixture, tentativasFixture } from './fixtures/tentativas';
import { chatSucessoFixture, chatRecusaFixture, chatErroFixture } from './fixtures/chat';
import { respostaStreamSSE } from './sse';

const rota = (caminho: string) => `${API_BASE_URL}${caminho}`;

// ---- Fichamentos: estado mutável em memória (reinicia a cada `npm run msw:dev`) --

const fichamentosPorId = new Map<string, FichamentoSaida>([
  [fichamentoSecaoFixture.id, fichamentoSecaoFixture],
  [fichamentoTrechoFixture.id, fichamentoTrechoFixture],
]);
const versoesPorFichamentoId = new Map<string, FichamentoVersaoSaida[]>([
  [fichamentoSecaoFixture.id, fichamentoVersoesFixture],
]);
let proximoIdFichamento = 3;

// ---- Tentativas: transição determinística entre as fixtures de cada tela ------

const proximaTentativaPorId: Record<string, string> = {
  'tentativa-passo-1': 'tentativa-passo-2',
  'tentativa-passo-2': 'tentativa-passo-3',
  'tentativa-passo-3': 'tentativa-resolvida',
};

export const handlers = [
  // ---- Autenticação -----------------------------------------------------------

  http.post(rota('/auth/registro'), async ({ request }) => {
    const corpo = (await request.json()) as { nome: string; email: string; senha: string };
    const resultado = registrar(corpo.nome, corpo.email, corpo.senha);
    if (resultado.tipo === 'email_em_uso') {
      return HttpResponse.json({ message: 'E-mail já cadastrado.', statusCode: 409 }, { status: 409 });
    }
    return HttpResponse.json(resultado.dados, { status: 201 });
  }),

  http.post(rota('/auth/login'), async ({ request }) => {
    const corpo = (await request.json()) as { email: string; senha: string };
    const resultado = autenticar(corpo.email, corpo.senha);
    if (resultado.tipo === 'credenciais_invalidas') {
      return HttpResponse.json({ message: 'Credenciais inválidas.', statusCode: 401 }, { status: 401 });
    }
    return HttpResponse.json(resultado.dados);
  }),

  http.get(rota('/me'), ({ request }) => {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const usuario = buscarUsuarioPorToken(token);
    return usuario
      ? HttpResponse.json(usuario)
      : HttpResponse.json({ message: 'Não autorizado.', statusCode: 401 }, { status: 401 });
  }),

  // ---- Catálogo -------------------------------------------------------------
  http.get(rota('/livros'), () => HttpResponse.json(livrosFixture)),

  http.get(rota('/livros/:id'), ({ params }) => {
    const livro = livrosFixture.find((item) => item.id === params.id);
    return livro ? HttpResponse.json(livro) : HttpResponse.json({ message: 'Livro não encontrado.', statusCode: 404 }, { status: 404 });
  }),

  http.get(rota('/livros/:id/sumario'), () => HttpResponse.json(sumarioFixture)),

  http.get(rota('/secoes/:id'), ({ params }) => {
    const secao = secoesFixture[params.id as string];
    return secao
      ? HttpResponse.json(secao)
      : HttpResponse.json({ message: 'Seção não encontrada.', statusCode: 404 }, { status: 404 });
  }),

  http.get(rota('/secoes/:id/panorama'), ({ params }) => HttpResponse.json(panoramaFixturePara(params.id as string))),

  // ---- Fichamentos ------------------------------------------------------------

  http.post(rota('/secoes/:id/fichamento'), async ({ params, request }) => {
    const corpo = (await request.json().catch(() => ({}))) as { trechoCfi?: string; trechoTexto?: string };
    const id = `fichamento-${proximoIdFichamento++}`;
    const novo: FichamentoSaida = {
      id,
      sectionId: params.id as string,
      trechoCfi: corpo.trechoCfi ?? null,
      numeroVersaoAtual: 1,
      origemVersaoAtual: 'ia',
      conteudo: corpo.trechoTexto
        ? `Resumo gerado a partir do trecho selecionado: "${corpo.trechoTexto.slice(0, 80)}..."`
        : 'Fichamento gerado pela IA para a seção inteira.',
      caracteresIa: 120,
      caracteresAluno: 0,
      proporcaoAluno: 0,
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    fichamentosPorId.set(id, novo);
    versoesPorFichamentoId.set(id, [
      { numero: 1, origem: 'ia', conteudo: novo.conteudo, criadoEm: novo.criadoEm },
    ]);
    return HttpResponse.json(novo, { status: 201 });
  }),

  http.get(rota('/fichamentos/:id'), ({ params }) => {
    const fichamento = fichamentosPorId.get(params.id as string);
    return fichamento
      ? HttpResponse.json(fichamento)
      : HttpResponse.json({ message: 'Fichamento não encontrado.', statusCode: 404 }, { status: 404 });
  }),

  http.patch(rota('/fichamentos/:id'), async ({ params, request }) => {
    const id = params.id as string;
    const atual = fichamentosPorId.get(id);
    if (!atual) {
      return HttpResponse.json({ message: 'Fichamento não encontrado.', statusCode: 404 }, { status: 404 });
    }
    const { conteudo } = (await request.json()) as { conteudo: string };
    const atualizado: FichamentoSaida = {
      ...atual,
      conteudo,
      numeroVersaoAtual: atual.numeroVersaoAtual + 1,
      origemVersaoAtual: 'aluno',
      atualizadoEm: new Date().toISOString(),
    };
    fichamentosPorId.set(id, atualizado);
    const versoes = versoesPorFichamentoId.get(id) ?? [];
    versoesPorFichamentoId.set(id, [
      ...versoes,
      { numero: atualizado.numeroVersaoAtual, origem: 'aluno', conteudo, criadoEm: atualizado.atualizadoEm },
    ]);
    return HttpResponse.json(atualizado);
  }),

  http.get(rota('/fichamentos/:id/versoes'), ({ params }) => {
    const versoes = versoesPorFichamentoId.get(params.id as string);
    return versoes
      ? HttpResponse.json(versoes)
      : HttpResponse.json({ message: 'Fichamento não encontrado.', statusCode: 404 }, { status: 404 });
  }),

  http.delete(rota('/fichamentos/:id'), ({ params }) => {
    fichamentosPorId.delete(params.id as string);
    versoesPorFichamentoId.delete(params.id as string);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(rota('/me/fichamentos'), () => HttpResponse.json(fichamentosDoAlunoFixture)),

  http.get(rota('/me/fichamentos/exportar'), ({ request }) => {
    const formato = new URL(request.url).searchParams.get('formato') ?? 'md';
    if (formato !== 'md') {
      return HttpResponse.json(
        { message: 'Formato não suportado.', error: 'Bad Request', statusCode: 400 },
        { status: 400 },
      );
    }
    return HttpResponse.text('# Fichamentos\n\n' + fichamentoSecaoFixture.conteudo);
  }),

  // ---- Telemetria -------------------------------------------------------------

  http.post(rota('/eventos'), async ({ request }) => {
    const corpo = (await request.json()) as { eventos: unknown[] };
    const quantidade = corpo.eventos?.length ?? 0;
    return HttpResponse.json({ recebidos: quantidade, gravados: quantidade });
  }),

  // ---- Conceitos ----------------------------------------------------------

  http.get(rota('/secoes/:id/conceitos'), () => HttpResponse.json(conceitosFixture)),
  http.get(rota('/me/conceitos'), () => HttpResponse.json(conceitosDoAlunoFixture)),

  // ---- Questões e tentativas (fluxo step-based) ------------------------------

  http.post(rota('/secoes/:id/questoes'), () => HttpResponse.json(conjuntoFixture, { status: 201 })),

  http.get(rota('/conjuntos/:id'), ({ params }) => {
    const conjunto: ConjuntoSaida | null = params.id === conjuntoFixture.id ? conjuntoFixture : null;
    return conjunto
      ? HttpResponse.json(conjunto)
      : HttpResponse.json({ message: 'Conjunto não encontrado.', statusCode: 404 }, { status: 404 });
  }),

  http.post(rota('/questoes/:id/tentativas'), ({ params }) =>
    HttpResponse.json({ ...tentativaPasso1Fixture, questaoId: params.id as string }, { status: 201 }),
  ),

  http.post(rota('/tentativas/:id/passos'), ({ params }) => {
    const id = params.id as string;
    const proximoId = proximaTentativaPorId[id];
    if (!proximoId) {
      return HttpResponse.json(
        { message: 'Esta tentativa não aceita mais passos.', statusCode: 400 },
        { status: 400 },
      );
    }
    return HttpResponse.json(tentativasFixture[proximoId]);
  }),

  http.post(rota('/tentativas/:id/desistir'), () => HttpResponse.json(tentativasFixture['tentativa-abandonada'])),

  http.get(rota('/tentativas/:id'), ({ params }) => {
    const tentativa: TentativaSaida | undefined = tentativasFixture[params.id as string];
    return tentativa
      ? HttpResponse.json(tentativa)
      : HttpResponse.json({ message: 'Tentativa não encontrada.', statusCode: 404 }, { status: 404 });
  }),

  // ---- Diálogo (chat) ----------------------------------------------------------

  http.post(rota('/sessoes'), async ({ request }) => {
    const corpo = (await request.json()) as { secaoId: string };
    const secao = secoesFixture[corpo.secaoId];
    const sessao: SessaoSaida = {
      id: 'sessao-1',
      sectionId: corpo.secaoId,
      tituloSecao: secao?.titulo ?? 'Seção',
      criadaEm: new Date().toISOString(),
      mensagens: [],
    };
    return HttpResponse.json(sessao, { status: 201 });
  }),

  http.get(rota('/sessoes/:id'), ({ params }) =>
    HttpResponse.json({
      id: params.id as string,
      sectionId: 'sec-3-1',
      tituloSecao: 'Heurísticas e Vieses',
      criadaEm: new Date().toISOString(),
      mensagens: [],
    } satisfies SessaoSaida),
  ),

  http.get(rota('/me/sessoes'), () => HttpResponse.json([])),

  /**
   * Escolha de cenário pelo conteúdo da mensagem, para testar as três
   * variantes sem trocar fixture: contém "recusa" → sem base; contém "erro"
   * → falha no meio do stream; qualquer outra coisa → resposta normal.
   */
  http.post(rota('/sessoes/:id/mensagens'), async ({ request }) => {
    const corpo = (await request.json().catch(() => ({}))) as { conteudo?: string };
    const texto = corpo.conteudo?.toLowerCase() ?? '';
    if (texto.includes('recusa')) return respostaStreamSSE(chatRecusaFixture);
    if (texto.includes('erro')) return respostaStreamSSE(chatErroFixture);
    return respostaStreamSSE(chatSucessoFixture);
  }),
];
