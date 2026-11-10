/**
 * Tipos copiados de docs/BACKEND_INTEGRATION.md. Quando o backend mudar,
 * atualize primeiro o documento e depois este arquivo.
 */

// ---- Autenticação --------------------------------------------------------

export type AutenticacaoSaida = {
  token: string;
  user: { id: string; nome: string; email: string; criadoEm: string };
};

export type UsuarioSaida = {
  id: string;
  nome: string;
  email: string;
  criadoEm: string;
};

// ---- Catálogo --------------------------------------------------------------

export type LivroSaida = {
  id: string;
  titulo: string;
  autor: string;
  isbn?: string;
  criadoEm: string;
};

export type SumarioNo = {
  id: string;
  titulo: string;
  nivel: number;
  ordem: number;
  href: string;
  filhas: SumarioNo[];
};

export type SecaoSaida = {
  id: string;
  titulo: string;
  textoCompleto: string;
  livro: { id: string; titulo: string };
  anterior: { id: string; titulo: string } | null;
  proxima: { id: string; titulo: string } | null;
};

// ---- Panorama ----------------------------------------------------------

export type PanoramaSaida = {
  niveis: Array<{ rotulo: string; titulo: string; texto: string }>; // sempre 4, ordem fixa
  tempoEstimadoMin: number;
};

// ---- Fichamentos ---------------------------------------------------------

export type StatusGeracao = 'pendente' | 'pronto' | 'erro';

export type FichamentoSaida = {
  id: string;
  sectionId: string;
  trechoCfi: string | null;
  numeroVersaoAtual: number;
  origemVersaoAtual: 'ia' | 'aluno';
  conteudo: string;
  caracteresIa: number;
  caracteresAluno: number;
  proporcaoAluno: number;
  criadoEm: string;
  atualizadoEm: string;
  // Campos aditivos (item 2.4 / 2.5 do contrato): ausentes em API mais antiga.
  tituloLivro?: string;
  livroId?: string;
  tituloSecao?: string;
  trechoTexto?: string | null;
  statusGeracao?: StatusGeracao;
  erroMensagem?: string | null;
};

export type FichamentoVersaoSaida = {
  numero: number;
  conteudo: string;
  origem: 'ia' | 'aluno';
  promptVersao?: number;
  modelo?: string;
  criadoEm: string;
};

export type FichamentoResumoDto = {
  id: string;
  sectionId: string;
  tituloSecao: string;
  livroId: string;
  tituloLivro: string;
  trechoCfi: string | null;
  origemVersaoAtual: 'ia' | 'aluno';
  editado: boolean;
  atualizadoEm: string;
  criadoEm?: string;
  trechoPreview?: string | null;
};

// ---- Telemetria ------------------------------------------------------------

export type TipoEvento =
  | 'abriu'
  | 'fechou'
  | 'rolou'
  | 'abriu_panorama'
  | 'gerou_fichamento'
  | 'editou_fichamento'
  | 'respondeu'
  | 'pediu_dica'
  | 'desistiu'
  | 'clicou_citacao'
  | 'registrou_metacognicao';

export type Evento = {
  tipo: TipoEvento;
  sectionId?: string;
  criadoEm: string; // ISO 8601
  payload?: Record<string, unknown>;
};

export type ProgressoSaida = {
  secoesAbertas: number;
  fichamentos: { total: number; comEdicaoDoAluno: number };
  /** Item 1.4: null quando o aluno nunca abriu nenhuma seção. Campo aditivo — ausente numa API mais antiga. */
  ultimaSecaoLida?: { sectionId: string; tituloSecao: string; livroId: string } | null;
};

// ---- Histórico de chat -----------------------------------------------------

export type MensagemHistoricoSaida = {
  id: string;
  papel: 'aluno' | 'tutora';
  conteudo: string;
  citacoes?: Array<{ chunkId: string; trecho: string; ancoraCfi: string; secaoTitulo: string; sectionId?: string }>;
  chunksCitados?: string[];
  encontrouBase: boolean | null;
  criadoEm: string;
};

export type HistoricoChatSaida = {
  sectionId: string;
  tituloSecao: string;
  total: number;
  pagina: number;
  tamanho: number;
  mensagens: MensagemHistoricoSaida[];
};

// ---- Questões, conceitos e tentativas (fluxo step-based) ------------------

export type ConceitoSaida = { id: string; nome: string; descricaoCurta: string };

export type ConceitoClassificado = {
  conceitoId: string;
  nome: string;
  sectionId: string;
  tituloSecao: string;
};

export type ConceitosDoAlunoSaida = {
  dominados: ConceitoClassificado[];
  aRevisar: ConceitoClassificado[];
};

export type ConjuntoSaida = {
  id: string;
  sectionId: string;
  criadoEm: string;
  questoes: Array<{
    id: string;
    ordem: number;
    enunciado: string;
    conceitos: Array<{ id: string; nome: string }>;
  }>;
};

export type PassoTipo =
  | 'pedido_justificativa'
  | 'dica_conceitual'
  | 'dica_localizada'
  | 'justificativa_aluno'
  | 'resolucao';

export type EstadoTentativa = 'aberta' | 'em_passos' | 'resolvida' | 'abandonada';

/**
 * Sem `trecho`: o backend só manda o id do chunk e a posição (`ancoraCfi`),
 * não o texto literal. Como o leitor não interpreta CFI de EPUB de verdade
 * (é texto puro, sem a árvore do epub.js), "Ver no texto" para um chunk
 * mostrado numa dica abre a seção sem conseguir destacar o trecho exato —
 * ver `src/lib/leitor/ancoragem.ts`.
 */
export type ChunkMostrado = { chunkId: string | null; sectionId: string; ancoraCfi: string | null };

export type TentativaSaida = {
  id: string;
  questaoId: string;
  estado: EstadoTentativa;
  nPassos: number;
  criadaEm: string;
  encerradaEm: string | null;
  passos: Array<{
    numero: number;
    tipo: PassoTipo;
    conteudo: string;
    criadoEm: string;
    chunksMostrados?: ChunkMostrado[];
  }>;
};

export type ConjuntoResumo = {
  id: string;
  sectionId: string;
  tituloSecao: string;
  livroId: string;
  tituloLivro: string;
  criadoEm: string;
  questoes: Array<{
    id: string;
    enunciado: string;
    tentativaId: string | null;
    estado: EstadoTentativa | 'pendente';
  }>;
};

// ---- Diálogo (chat) ---------------------------------------------------------

export type SessaoSaida = {
  id: string;
  sectionId: string;
  tituloSecao: string;
  criadaEm: string;
  mensagens: Array<{
    id: string;
    papel: 'aluno' | 'tutora';
    conteudo: string;
    chunksCitados: string[];
    encontrouBase: boolean | null;
    criadoEm: string;
  }>;
};

export type SessaoResumo = { id: string; sectionId: string; tituloSecao: string; criadaEm: string };

export type Sugestao = {
  tipo: 'buscar_outras_secoes' | 'abrir_glossario' | 'inferir_pelo_contexto';
  descricao: string;
  sectionId?: string;
};

export type EventoChat =
  | { tipo: 'token'; texto: string }
  | { tipo: 'citacao'; chunkId: string; trecho: string; ancoraCfi: string; secaoTitulo: string; sectionId?: string }
  | { tipo: 'fim'; messageId: string; encontrouBase: boolean; sugestoes?: Sugestao[] }
  | { tipo: 'erro'; mensagem: string };

export type VocabularioSaida = { conteudo: string; promptVersao: number; modelo: string };

// ---- Metacognição e reportes -----------------------------------------------

export type MetacognicaoSaida = {
  id: string;
  sectionId: string;
  tituloSecao: string;
  oQueAprendi: string;
  oQueDuvido: string;
  confianca: number;
  observacaoIa: string | null;
  sinalizouIlusao: boolean;
  criadoEm: string;
  semDadosDeComparacao?: boolean;
  questoesFaltando?: number;
};

export type ReporteSaida = {
  id: string;
  alvoTipo: string;
  alvoId: string;
  descricao: string;
  status: 'aberto' | 'analisado' | 'corrigido';
  criadoEm: string;
};
