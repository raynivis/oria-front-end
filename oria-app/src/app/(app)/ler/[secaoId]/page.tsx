import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { SecaoSaida, SumarioNo } from '@/lib/api/tipos';
import { encontrarCapituloAncestral } from '@/lib/leitor/sumario';
import { SumarioArvore } from '@/components/biblioteca/sumario-arvore';
import { TextoSecao } from '@/components/leitor/texto-secao';
import { PainelTutora } from '@/components/leitor/painel-tutora';
import { BarraMobile } from '@/components/leitor/barra-mobile';
import { GuardaPanorama } from '@/components/leitor/guarda-panorama';

type ParametrosPagina = { params: Promise<{ secaoId: string }> };

async function buscarDadosOu404(secaoId: string): Promise<[SecaoSaida, SumarioNo[]]> {
  try {
    const secao = await chamarApi<SecaoSaida>(`/secoes/${secaoId}`);
    const sumario = await chamarApi<SumarioNo[]>(`/livros/${secao.livro.id}/sumario`);
    return [secao, sumario];
  } catch (erro) {
    if (erro instanceof ErroApiCliente && erro.statusCode === 404) {
      notFound();
    }
    throw erro;
  }
}

export async function generateMetadata({ params }: ParametrosPagina): Promise<Metadata> {
  const { secaoId } = await params;
  const [secao] = await buscarDadosOu404(secaoId);
  return { title: `${secao.titulo} — Tutora Oria` };
}

export default async function PaginaLeitor({ params }: ParametrosPagina) {
  const { secaoId } = await params;
  const [secao, sumario] = await buscarDadosOu404(secaoId);
  const capitulo = encontrarCapituloAncestral(sumario, secaoId);

  return (
    <GuardaPanorama secaoId={secaoId}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <BarraMobile sumario={<SumarioArvore nos={sumario} ativoId={secaoId} />} tutora={<PainelTutora />} />

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-border p-4 md:block">
            <SumarioArvore nos={sumario} ativoId={secaoId} />
          </aside>

          <main className="flex-1 overflow-y-auto px-6 py-8">
            <div className="mx-auto max-w-[68ch]">
              {capitulo && <p className="text-sm text-muted-foreground">{capitulo}</p>}
              <h1 className="mb-2 text-2xl font-semibold">{secao.titulo}</h1>
              <Link
                href={`/ler/${secaoId}/panorama`}
                className="text-sm text-primary underline-offset-4 hover:underline"
              >
                Ver panorama da seção
              </Link>
            </div>

            <div className="mt-6">
              <TextoSecao texto={secao.textoCompleto} />
            </div>

            <nav className="mx-auto mt-10 flex max-w-[68ch] justify-between text-sm">
              {secao.anterior ? (
                <Link href={`/ler/${secao.anterior.id}`} className="hover:underline">
                  ← {secao.anterior.titulo}
                </Link>
              ) : (
                <span />
              )}
              {secao.proxima ? (
                <Link href={`/ler/${secao.proxima.id}`} className="hover:underline">
                  {secao.proxima.titulo} →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          </main>

          <aside className="hidden w-[360px] shrink-0 overflow-y-auto border-l border-border p-4 lg:block">
            <PainelTutora />
          </aside>
        </div>
      </div>
    </GuardaPanorama>
  );
}
