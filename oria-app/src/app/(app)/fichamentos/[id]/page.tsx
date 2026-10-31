import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { chamarApi, redirecionarSeSessaoExpirada } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { FichamentoSaida, FichamentoVersaoSaida } from '@/lib/api/tipos';
import { EditorFichamento } from '@/components/fichamento/editor-fichamento';
import { HistoricoVersoes } from '@/components/fichamento/historico-versoes';
import { BotaoReporte } from '@/components/reportes/botao';

type ParametrosPagina = { params: Promise<{ id: string }> };

async function buscarOu404(id: string): Promise<{ fichamento: FichamentoSaida; versoes: FichamentoVersaoSaida[] }> {
  try {
    const [fichamento, versoes] = await Promise.all([
      chamarApi<FichamentoSaida>(`/fichamentos/${id}`),
      chamarApi<FichamentoVersaoSaida[]>(`/fichamentos/${id}/versoes`),
    ]);
    return { fichamento, versoes };
  } catch (erro) {
    if (erro instanceof ErroApiCliente && erro.statusCode === 404) {
      notFound();
    }
    redirecionarSeSessaoExpirada(erro);
    throw erro;
  }
}

export const metadata: Metadata = { title: 'Fichamento — Tutora Oria' };

export default async function PaginaFichamento({ params }: ParametrosPagina) {
  const { id } = await params;
  const { fichamento, versoes } = await buscarOu404(id);

  return (
    <main className="mx-auto w-full max-w-[68ch] flex-1 px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold">Fichamento</h1>
        <div className="flex items-center gap-2">
          {/* Texto, nunca barra — a regra 5 do CLAUDE.md proíbe progresso em percentual/meta. */}
          <p className="text-sm text-muted-foreground">
            {Math.round(fichamento.proporcaoAluno * 100)}% do texto atual é seu
          </p>
          <BotaoReporte alvoTipo="fichamento" alvoId={fichamento.id} />
        </div>
      </div>

      <EditorFichamento fichamento={fichamento} versoes={versoes} />

      <HistoricoVersoes versoes={versoes} />
    </main>
  );
}
