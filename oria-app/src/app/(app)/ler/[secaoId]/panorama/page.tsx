import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { PanoramaSaida, SecaoSaida, SumarioNo } from '@/lib/api/tipos';
import { encontrarCapituloAncestral } from '@/lib/leitor/sumario';
import { BotaoComecarLeitura } from '@/components/leitor/botao-comecar-leitura';

type ParametrosPagina = { params: Promise<{ secaoId: string }> };

async function buscarDadosOu404(secaoId: string) {
  try {
    const secao = await chamarApi<SecaoSaida>(`/secoes/${secaoId}`);
    const [sumario, panorama] = await Promise.all([
      chamarApi<SumarioNo[]>(`/livros/${secao.livro.id}/sumario`),
      chamarApi<PanoramaSaida>(`/secoes/${secaoId}/panorama`),
    ]);
    return { secao, sumario, panorama };
  } catch (erro) {
    if (erro instanceof ErroApiCliente && erro.statusCode === 404) {
      notFound();
    }
    throw erro;
  }
}

export async function generateMetadata({ params }: ParametrosPagina): Promise<Metadata> {
  const { secaoId } = await params;
  const { secao } = await buscarDadosOu404(secaoId);
  return { title: `Panorama · ${secao.titulo} — Tutora Oria` };
}

export default async function PaginaPanorama({ params }: ParametrosPagina) {
  const { secaoId } = await params;
  const { secao, sumario, panorama } = await buscarDadosOu404(secaoId);
  const capitulo = encontrarCapituloAncestral(sumario, secaoId);

  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center gap-8 px-4 py-12 text-center">
      <div>
        <p className="text-sm text-muted-foreground">Panorama{capitulo ? ` · ${capitulo}` : ''}</p>
        <h1 className="text-2xl font-semibold">{secao.titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Leitura estimada: {panorama.tempoEstimadoMin} minutos</p>
      </div>

      <p className="max-w-md text-sm text-muted-foreground">
        A ordem abaixo vai do mais geral ao mais específico: comece pelo enquadramento, depois observe o mecanismo
        e só então os casos particulares.
      </p>

      <ol className="flex w-full flex-col gap-6 text-left">
        {panorama.niveis.map((nivel) => (
          <li key={nivel.rotulo}>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{nivel.rotulo}</p>
            <p className="font-medium">{nivel.titulo}</p>
            <p className="text-sm text-muted-foreground">{nivel.texto}</p>
          </li>
        ))}
      </ol>

      <BotaoComecarLeitura secaoId={secaoId} />
    </main>
  );
}
