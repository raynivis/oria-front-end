import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { ConjuntoSaida } from '@/lib/api/tipos';
import { CartaoQuestao } from '@/components/questoes/cartao-questao';

type ParametrosPagina = { params: Promise<{ conjuntoId: string }> };

async function buscarOu404(conjuntoId: string): Promise<ConjuntoSaida> {
  try {
    return await chamarApi<ConjuntoSaida>(`/conjuntos/${conjuntoId}`);
  } catch (erro) {
    if (erro instanceof ErroApiCliente && erro.statusCode === 404) {
      notFound();
    }
    throw erro;
  }
}

export const metadata: Metadata = { title: 'Questões — Tutora Oria' };

export default async function PaginaQuestoes({ params }: ParametrosPagina) {
  const { conjuntoId } = await params;
  const conjunto = await buscarOu404(conjuntoId);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Questões</h1>
      <div className="flex flex-col gap-6">
        {conjunto.questoes
          .sort((a, b) => a.ordem - b.ordem)
          .map((questao) => (
            <CartaoQuestao key={questao.id} questao={questao} sectionId={conjunto.sectionId} />
          ))}
      </div>
    </main>
  );
}
