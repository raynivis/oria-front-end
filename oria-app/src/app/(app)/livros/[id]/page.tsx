import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { chamarApi, redirecionarSeSessaoExpirada } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { LivroSaida, SumarioNo } from '@/lib/api/tipos';
import { SumarioArvore } from '@/components/biblioteca/sumario-arvore';

type ParametrosPagina = { params: Promise<{ id: string }> };

async function buscarLivroOu404(id: string): Promise<[LivroSaida, SumarioNo[]]> {
  try {
    return await Promise.all([
      chamarApi<LivroSaida>(`/livros/${id}`),
      chamarApi<SumarioNo[]>(`/livros/${id}/sumario`),
    ]);
  } catch (erro) {
    if (erro instanceof ErroApiCliente && erro.statusCode === 404) {
      notFound();
    }
    redirecionarSeSessaoExpirada(erro);
    throw erro;
  }
}

export async function generateMetadata({ params }: ParametrosPagina): Promise<Metadata> {
  const { id } = await params;
  const [livro] = await buscarLivroOu404(id);
  return { title: `${livro.titulo} — Tutora Oria` };
}

export default async function PaginaLivro({ params }: ParametrosPagina) {
  const { id } = await params;
  const [livro, sumario] = await buscarLivroOu404(id);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <p className="text-sm text-muted-foreground">{livro.autor}</p>
      <h1 className="mb-6 text-2xl font-semibold">{livro.titulo}</h1>
      <SumarioArvore nos={sumario} />
    </main>
  );
}
