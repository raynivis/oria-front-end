import { http, HttpResponse } from 'msw';
import type {
  ConjuntoSaida,
  FichamentoSaida,
  FichamentoVersaoSaida,
  MetacognicaoSaida,
  PassoTipo,
  ReporteSaida,
  SessaoResumo,
  SessaoSaida,
  TentativaSaida,
} from '@/lib/api/tipos';
import { API_BASE_URL } from '@/lib/api/base-url';
import { autenticar, buscarUsuarioPorToken, registrar } from './fixtures/auth';
import { livrosFixture, livroMenteEDecisao } from './fixtures/livros';
import { sumarioFixture } from './fixtures/sumario';
import { secoesFixture } from './fixtures/secoes';
import { panoramaFixturePara } from './fixtures/panorama';
import {
  fichamentoSecaoFixture,
  fichamentoTrechoFixture,
  fichamentoTrechoVersoesFixture,
  fichamentoVersoesFixture,
} from './fixtures/fichamentos';
import { conceitosFixture, conceitosDoAlunoFixture } from './fixtures/conceitos';
import { conjuntoFixture } from './fixtures/questoes';
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
  [fichamentoTrechoFixture.id, fichamentoTrechoVersoesFixture],
]);
let proximoIdFichamento = 3;

// ---- Sessões de chat: uma por seção, reaproveitada entre visitas -------------

const sessoesPorSecaoId = new Map<string, SessaoSaida>();

// ---- Tentativas: estado real em memória, uma por chamada de POST ------------

const tentativasPorId = new Map<string, TentativaSaida>();
let proximoIdTentativa = 1;
let proximoIdMetacognicao = 1;
let proximoIdReporte = 1;

// ---- Progresso: derivado do que o próprio mock já registra ------------------

const secoesAbertasRegistradas = new Set<string>();

const DICA_CONCEITUAL_PADRAO = 'Pense no mecanismo central descrito no texto, não só no efeito que ele produz.';
const DICA_LOCALIZADA_PADRAO = 'Releia o trecho da seção que nomeia diretamente os dois elementos da sua resposta.';
const RESOLUCAO_PADRAO =
  'A pergunta original costuma ser mais difícil do que a pergunta que de fato respondemos; o primeiro passo para notar a troca é nomear as duas perguntas separadamente.';

function criarPasso(numero: number, tipo: PassoTipo, conteudo: string) {
  return { numero, tipo, conteudo, criadoEm: new Date().toISOString() };
}

/** Mesma lógica de diferença por parágrafo que o front usa para a marcação visual (UI_RULES.md, 4.2). */
function calcularProporcaoAluno(
  conteudoAtual: string,
  versoes: FichamentoVersaoSaida[],
): { caracteresIa: number; caracteresAluno: number; proporcaoAluno: number } {
  const versaoBaseIA = [...versoes].sort((a, b) => a.numero - b.numero).find((v) => v.origem === 'ia');
  const paragrafosBase = versaoBaseIA ? versaoBaseIA.conteudo.split('\n\n') : [];
  const paragrafosAtuais = conteudoAtual.split('\n\n');

  let caracteresIa = 0;
  let caracteresAluno = 0;
  paragrafosAtuais.forEach((paragrafo, indice) => {
    if (paragrafo === paragrafosBase[indice]) caracteresIa += paragrafo.length;
    else caracteresAluno += paragrafo.length;
  });

  const total = caracteresIa + caracteresAluno;
  return { caracteresIa, caracteresAluno, proporcaoAluno: total === 0 ? 0 : caracteresAluno / total };
}


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
    const versoesAnteriores = versoesPorFichamentoId.get(id) ?? [];
    const atualizado: FichamentoSaida = {
      ...atual,
      conteudo,
      numeroVersaoAtual: atual.numeroVersaoAtual + 1,
      origemVersaoAtual: 'aluno',
      atualizadoEm: new Date().toISOString(),
      ...calcularProporcaoAluno(conteudo, versoesAnteriores),
    };
    fichamentosPorId.set(id, atualizado);
    const versoes = versoesAnteriores;
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

  http.get(rota('/me/fichamentos'), () => {
    const lista = Array.from(fichamentosPorId.values())
      .sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
      .map((fichamento) => ({
        id: fichamento.id,
        sectionId: fichamento.sectionId,
        tituloSecao: secoesFixture[fichamento.sectionId]?.titulo ?? fichamento.sectionId,
        livroId: livroMenteEDecisao.id,
        tituloLivro: livroMenteEDecisao.titulo,
        trechoCfi: fichamento.trechoCfi,
        origemVersaoAtual: fichamento.origemVersaoAtual,
        editado: fichamento.numeroVersaoAtual > 1,
        atualizadoEm: fichamento.atualizadoEm,
      }));
    return HttpResponse.json(lista);
  }),

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
    const corpo = (await request.json()) as { eventos: Array<{ tipo: string; sectionId?: string }> };
    const quantidade = corpo.eventos?.length ?? 0;
    for (const evento of corpo.eventos ?? []) {
      if (evento.tipo === 'abriu' && evento.sectionId) secoesAbertasRegistradas.add(evento.sectionId);
    }
    return HttpResponse.json({ recebidos: quantidade, gravados: quantidade });
  }),

  http.get(rota('/me/progresso'), () => {
    const fichamentos = Array.from(fichamentosPorId.values());
    return HttpResponse.json({
      secoesAbertas: secoesAbertasRegistradas.size,
      fichamentos: {
        total: fichamentos.length,
        comEdicaoDoAluno: fichamentos.filter((f) => f.numeroVersaoAtual > 1).length,
      },
    });
  }),

  // ---- Conceitos ----------------------------------------------------------

  http.get(rota('/secoes/:id/conceitos'), () => HttpResponse.json(conceitosFixture)),
  http.get(rota('/me/conceitos'), () => HttpResponse.json(conceitosDoAlunoFixture)),

  // ---- Metacognição e reportes ------------------------------------------------

  /** Sem dados reais de desempenho no mock: usa a própria confiança declarada como sinal. */
  http.post(rota('/secoes/:id/metacognicao'), async ({ params, request }) => {
    const secaoId = params.id as string;
    const corpo = (await request.json()) as { oQueAprendi: string; oQueDuvido: string; confianca: number };
    const secao = secoesFixture[secaoId];
    const sinalizouIlusao = corpo.confianca >= 70;

    const metacognicao: MetacognicaoSaida = {
      id: `metacognicao-${proximoIdMetacognicao++}`,
      sectionId: secaoId,
      tituloSecao: secao?.titulo ?? 'Seção',
      oQueAprendi: corpo.oQueAprendi,
      oQueDuvido: corpo.oQueDuvido,
      confianca: corpo.confianca,
      observacaoIa: sinalizouIlusao
        ? `Você declarou confiança de ${corpo.confianca}%, mas precisou dos três passos em boa parte das questões desta seção.`
        : null,
      sinalizouIlusao,
      criadoEm: new Date().toISOString(),
    };
    return HttpResponse.json(metacognicao, { status: 201 });
  }),

  http.post(rota('/reportes'), async ({ request }) => {
    const corpo = (await request.json()) as { alvoTipo: string; alvoId: string; descricao: string };
    const reporte: ReporteSaida = {
      id: `reporte-${proximoIdReporte++}`,
      alvoTipo: corpo.alvoTipo,
      alvoId: corpo.alvoId,
      descricao: corpo.descricao,
      status: 'aberto',
      criadoEm: new Date().toISOString(),
    };
    return HttpResponse.json(reporte, { status: 201 });
  }),

  // ---- Questões e tentativas (fluxo step-based) ------------------------------

  http.post(rota('/secoes/:id/questoes'), () => HttpResponse.json(conjuntoFixture, { status: 201 })),

  http.get(rota('/conjuntos/:id'), ({ params }) => {
    const conjunto: ConjuntoSaida | null = params.id === conjuntoFixture.id ? conjuntoFixture : null;
    return conjunto
      ? HttpResponse.json(conjunto)
      : HttpResponse.json({ message: 'Conjunto não encontrado.', statusCode: 404 }, { status: 404 });
  }),

  http.post(rota('/questoes/:id/tentativas'), async ({ params, request }) => {
    const questaoId = params.id as string;
    await request.json().catch(() => ({})); // { resposta } — o mock não usa o conteúdo, só avança o estado
    const id = `tentativa-${proximoIdTentativa++}`;
    const tentativa: TentativaSaida = {
      id,
      questaoId,
      estado: 'em_passos',
      nPassos: 1,
      criadaEm: new Date().toISOString(),
      encerradaEm: null,
      passos: [criarPasso(1, 'pedido_justificativa', 'Antes de eu comentar: em que trecho você se apoiou?')],
    };
    tentativasPorId.set(id, tentativa);
    return HttpResponse.json(tentativa, { status: 201 });
  }),

  http.post(rota('/tentativas/:id/passos'), async ({ params, request }) => {
    const id = params.id as string;
    const atual = tentativasPorId.get(id);
    if (!atual) {
      return HttpResponse.json({ message: 'Tentativa não encontrada.', statusCode: 404 }, { status: 404 });
    }
    if (atual.estado === 'resolvida' || atual.estado === 'abandonada') {
      return HttpResponse.json({ message: 'Esta tentativa já está encerrada.', statusCode: 400 }, { status: 400 });
    }

    const corpo = (await request.json()) as { tipo: string; conteudo?: string };
    const ultimo = atual.passos.at(-1);

    if (corpo.tipo === 'resolucao') {
      if (ultimo?.tipo !== 'dica_localizada') {
        return HttpResponse.json(
          { message: 'Ainda não é possível ver a resolução.', statusCode: 400 },
          { status: 400 },
        );
      }
      const passos = [...atual.passos, criarPasso(atual.passos.length + 1, 'resolucao', RESOLUCAO_PADRAO)];
      const atualizado: TentativaSaida = {
        ...atual,
        passos,
        nPassos: passos.length,
        estado: 'resolvida',
        encerradaEm: new Date().toISOString(),
      };
      tentativasPorId.set(id, atualizado);
      return HttpResponse.json(atualizado);
    }

    // justificativa_aluno: registra a resposta do aluno e já devolve a próxima dica.
    const respostaAluno = criarPasso(atual.passos.length + 1, 'justificativa_aluno', corpo.conteudo ?? '');
    const proximaDica =
      ultimo?.tipo === 'pedido_justificativa'
        ? criarPasso(atual.passos.length + 2, 'dica_conceitual', DICA_CONCEITUAL_PADRAO)
        : criarPasso(atual.passos.length + 2, 'dica_localizada', DICA_LOCALIZADA_PADRAO);

    const passos = [...atual.passos, respostaAluno, proximaDica];
    const atualizado: TentativaSaida = { ...atual, passos, nPassos: passos.length, estado: 'em_passos' };
    tentativasPorId.set(id, atualizado);
    return HttpResponse.json(atualizado);
  }),

  http.post(rota('/tentativas/:id/desistir'), ({ params }) => {
    const id = params.id as string;
    const atual = tentativasPorId.get(id);
    if (!atual) {
      return HttpResponse.json({ message: 'Tentativa não encontrada.', statusCode: 404 }, { status: 404 });
    }
    const atualizado: TentativaSaida = { ...atual, estado: 'abandonada', encerradaEm: new Date().toISOString() };
    tentativasPorId.set(id, atualizado);
    return HttpResponse.json(atualizado);
  }),

  http.get(rota('/tentativas/:id'), ({ params }) => {
    const tentativa = tentativasPorId.get(params.id as string);
    return tentativa
      ? HttpResponse.json(tentativa)
      : HttpResponse.json({ message: 'Tentativa não encontrada.', statusCode: 404 }, { status: 404 });
  }),

  // ---- Diálogo (chat) ----------------------------------------------------------

  http.post(rota('/sessoes'), async ({ request }) => {
    const corpo = (await request.json()) as { secaoId: string };
    const existente = sessoesPorSecaoId.get(corpo.secaoId);
    if (existente) return HttpResponse.json(existente, { status: 201 });

    const secao = secoesFixture[corpo.secaoId];
    const sessao: SessaoSaida = {
      id: `sessao-${sessoesPorSecaoId.size + 1}`,
      sectionId: corpo.secaoId,
      tituloSecao: secao?.titulo ?? 'Seção',
      criadaEm: new Date().toISOString(),
      mensagens: [],
    };
    sessoesPorSecaoId.set(corpo.secaoId, sessao);
    return HttpResponse.json(sessao, { status: 201 });
  }),

  http.get(rota('/sessoes/:id'), ({ params }) => {
    const sessao = Array.from(sessoesPorSecaoId.values()).find((s) => s.id === params.id);
    return sessao
      ? HttpResponse.json(sessao)
      : HttpResponse.json({ message: 'Sessão não encontrada.', statusCode: 404 }, { status: 404 });
  }),

  http.get(rota('/me/sessoes'), () => {
    const resumos: SessaoResumo[] = Array.from(sessoesPorSecaoId.values()).map((sessao) => ({
      id: sessao.id,
      sectionId: sessao.sectionId,
      tituloSecao: sessao.tituloSecao,
      criadaEm: sessao.criadaEm,
    }));
    return HttpResponse.json(resumos);
  }),

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
