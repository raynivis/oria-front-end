import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { chamarApi, redirecionarSeSessaoExpirada } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { ConjuntoResumo, ConjuntoSaida, SecaoSaida } from '@/lib/api/tipos';
import { CartaoQuestao } from '@/components/questoes/cartao-questao';

type ParametrosPagina = { params: Promise<{ conjuntoId: string }> };

async function buscarOu404(conjuntoId: string): Promise<{ conjunto: ConjuntoSaida; secao: SecaoSaida; concluidas: number }> {
  try {
    const conjunto = await chamarApi<ConjuntoSaida>(`/conjuntos/${conjuntoId}`);
    const secao = await chamarApi<SecaoSaida>(`/secoes/${conjunto.sectionId}`);

    let concluidas = 0;
    try {
      const resumos = await chamarApi<ConjuntoResumo[]>('/me/conjuntos');
      const resumo = resumos.find((r) => r.id === conjuntoId);
      concluidas = resumo?.questoes.filter((q) => q.estado === 'resolvida').length ?? 0;
    } catch {
      concluidas = 0;
    }

    return { conjunto, secao, concluidas };
  } catch (erro) {
    if (erro instanceof ErroApiCliente && erro.statusCode === 404) {
      notFound();
    }
    redirecionarSeSessaoExpirada(erro);
    throw erro;
  }
}

export async function generateMetadata({ params }: ParametrosPagina): Promise<Metadata> {
  const { conjuntoId } = await params;
  const { secao } = await buscarOu404(conjuntoId);
  return { title: `Questões · ${secao.titulo} — Tutora Oria` };
}

export default async function PaginaQuestoes({ params }: ParametrosPagina) {
  const { conjuntoId } = await params;
  const { conjunto, secao, concluidas } = await buscarOu404(conjuntoId);
  const questoesOrdenadas = [...conjunto.questoes].sort((a, b) => a.ordem - b.ordem);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <Link href={`/ler/${conjunto.sectionId}`} className="text-sm font-medium text-primary hover:underline">
        ← Voltar ao texto
      </Link>
      <div className="mt-2 mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Questões · {secao.titulo}</h1>
        <p className="text-sm text-muted-foreground">
          {concluidas} de {questoesOrdenadas.length} concluídas
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {questoesOrdenadas.map((questao, indice) => (
          <CartaoQuestao key={questao.id} questao={questao} sectionId={conjunto.sectionId} numeroQuestao={indice + 1} />
        ))}
      </div>

      <div className="mt-6">
        <Link href={`/metacognicao/${conjunto.sectionId}`} className="text-sm font-medium text-primary hover:underline">
          Fechar esta seção →
        </Link>
      </div>
    </main>
  );
}
