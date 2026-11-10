import type { Sugestao } from '@/lib/api/tipos';

export type Citacao = { chunkId: string; trecho: string; ancoraCfi: string; secaoTitulo: string; sectionId?: string };

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
      sugestoes?: Sugestao[];
      /** Guarda a pergunta original para o botão "Tentar de novo" (item 1.12). */
      perguntaOriginal?: string;
    };
