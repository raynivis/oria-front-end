export type Citacao = { chunkId: string; trecho: string; ancoraCfi: string; secaoTitulo: string };

export type Mensagem =
  | { id: string; papel: 'aluno'; conteudo: string }
  | {
      id: string;
      papel: 'tutora';
      conteudo: string;
      citacoes: Citacao[];
      encontrouBase: boolean | null;
      erro: string | null;
      emAndamento: boolean;
    };
