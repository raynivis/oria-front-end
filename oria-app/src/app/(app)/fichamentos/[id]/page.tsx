import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { chamarApi, redirecionarSeSessaoExpirada } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { FichamentoSaida, FichamentoVersaoSaida } from '@/lib/api/tipos';
import { AcompanharGeracao } from '@/components/fichamento/acompanhar-geracao';

type ParametrosPagina = { params: Promise<{ id: string }> };

async function buscarOu404(id: string): Promise<{ fichamento: FichamentoSaida; versoes: FichamentoVersaoSaida[] }> {
  try {
    const fichamento = await chamarApi<FichamentoSaida>(`/fichamentos/${id}`);
    // Enquanto a geração está pendente não há versões nem conteúdo definitivo ainda.
    const versoes =
      fichamento.statusGeracao === 'pendente'
        ? []
        : await chamarApi<FichamentoVersaoSaida[]>(`/fichamentos/${id}/versoes`);
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
      <AcompanharGeracao fichamentoInicial={fichamento} versoesIniciais={versoes} />
    </main>
  );
}
