import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { SecaoSaida, SumarioNo } from '@/lib/api/tipos';
import { encontrarCapituloAncestral } from '@/lib/leitor/sumario';
import { SumarioArvore } from '@/components/biblioteca/sumario-arvore';
import { TextoSecao } from '@/components/leitor/texto-secao';
import { BarraMobile } from '@/components/leitor/barra-mobile';
import { GuardaPanorama } from '@/components/leitor/guarda-panorama';
import { InstrumentacaoLeitura } from '@/components/leitor/instrumentacao-leitura';
import { ContadorSecoes } from '@/components/leitor/contador-secoes';
import { BotaoGerarFichamento } from '@/components/fichamento/botao-gerar-fichamento';
import { BotaoFazerQuestoes } from '@/components/questoes/botao-fazer-questoes';
import { PainelChat } from '@/components/chat/painel';
import { obterOuCriarSessao } from '@/lib/chat/sessao';
import type { SessaoSaida } from '@/lib/api/tipos';

type ParametrosPagina = { params: Promise<{ secaoId: string }> };

async function buscarDadosOu404(secaoId: string): Promise<{ secao: SecaoSaida; sumario: SumarioNo[]; sessao: SessaoSaida }> {
  try {
    const [secao, sessao] = await Promise.all([
      chamarApi<SecaoSaida>(`/secoes/${secaoId}`),
      obterOuCriarSessao(secaoId),
    ]);
    const sumario = await chamarApi<SumarioNo[]>(`/livros/${secao.livro.id}/sumario`);
    return { secao, sumario, sessao };
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
  return { title: `${secao.titulo} — Tutora Oria` };
}

export default async function PaginaLeitor({ params }: ParametrosPagina) {
  const { secaoId } = await params;
  const { secao, sumario, sessao } = await buscarDadosOu404(secaoId);
  const capitulo = encontrarCapituloAncestral(sumario, secaoId);

  return (
    <GuardaPanorama secaoId={secaoId}>
      <div className="flex flex-1 flex-col overflow-hidden">
        <BarraMobile
          sumario={<SumarioArvore nos={sumario} ativoId={secaoId} />}
          tutora={<PainelChat sessaoId={sessao.id} secaoId={secaoId} />}
        />

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-border p-4 md:block">
            <SumarioArvore nos={sumario} ativoId={secaoId} />
          </aside>

          <InstrumentacaoLeitura secaoId={secaoId}>
            <div className="mx-auto max-w-[68ch]">
              {capitulo && <p className="text-sm text-muted-foreground">{capitulo}</p>}
              <h1 className="mb-2 text-2xl font-semibold">{secao.titulo}</h1>
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <Link href={`/ler/${secaoId}/panorama`} className="text-sm font-medium text-primary hover:underline">
                    Ver panorama da seção
                  </Link>
                  <ContadorSecoes sumario={sumario} />
                </div>
                <div className="flex items-center gap-2">
                  <BotaoFazerQuestoes secaoId={secaoId} />
                  <BotaoGerarFichamento secaoId={secaoId} rotulo="Gerar fichamento desta seção" />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <TextoSecao texto={secao.textoCompleto} secaoId={secaoId} />
            </div>

            <div className="mx-auto mt-6 max-w-[68ch]">
              <Link href={`/metacognicao/${secaoId}`} className="text-sm font-medium text-primary hover:underline">
                Fechar esta seção →
              </Link>
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
          </InstrumentacaoLeitura>

          <aside className="hidden w-[360px] shrink-0 overflow-y-auto border-l border-border p-4 lg:block">
            <PainelChat sessaoId={sessao.id} secaoId={secaoId} />
          </aside>
        </div>
      </div>
    </GuardaPanorama>
  );
}
