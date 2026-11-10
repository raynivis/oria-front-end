import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { chamarApi, redirecionarSeSessaoExpirada } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { ProgressoSaida, SecaoSaida, SumarioNo, HistoricoChatSaida } from '@/lib/api/tipos';
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
import { PainelChatDesktop } from '@/components/chat/painel-desktop';
import { ProvedorPerguntaTrecho } from '@/lib/chat/contexto-pergunta-trecho';
import { obterOuCriarSessao } from '@/lib/chat/sessao';
import type { SessaoSaida } from '@/lib/api/tipos';

type ParametrosPagina = { params: Promise<{ secaoId: string }> };

async function buscarDadosOu404(secaoId: string): Promise<{
  secao: SecaoSaida;
  sumario: SumarioNo[];
  sessao: SessaoSaida;
  progresso: ProgressoSaida;
  historico: HistoricoChatSaida['mensagens'];
}> {
  try {
    const [secao, sessao, progresso] = await Promise.all([
      chamarApi<SecaoSaida>(`/secoes/${secaoId}`),
      obterOuCriarSessao(secaoId),
      chamarApi<ProgressoSaida>('/me/progresso'),
    ]);
    const sumario = await chamarApi<SumarioNo[]>(`/livros/${secao.livro.id}/sumario`);

    // Histórico do chat (item 1.8): endpoint aditivo — numa API antiga sem ele,
    // a tela simplesmente começa sem histórico, em vez de quebrar.
    let historico: HistoricoChatSaida['mensagens'] = [];
    try {
      const resultado = await chamarApi<HistoricoChatSaida>(`/me/secoes/${secaoId}/historico`);
      historico = resultado.mensagens ?? [];
    } catch {
      historico = [];
    }

    return { secao, sumario, sessao, progresso, historico };
  } catch (erro) {
    if (erro instanceof ErroApiCliente && erro.statusCode === 404) {
      notFound();
    }
    redirecionarSeSessaoExpirada(erro);
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
  const { secao, sumario, sessao, progresso, historico } = await buscarDadosOu404(secaoId);
  const capitulo = encontrarCapituloAncestral(sumario, secaoId);

  const barraAcoes = (
    <div className="sticky top-0 z-10 border-b border-border bg-background/95 px-6 py-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto max-w-[68ch]">
        {capitulo && <p className="text-sm text-muted-foreground">{capitulo}</p>}
        <h1 className="mb-2 text-2xl font-semibold">{secao.titulo}</h1>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            {/*
              prefetch=false: esta barra fica fixa (sticky) e visível o tempo
              todo enquanto o aluno lê e conversa com a tutora. O prefetch
              automático do App Router para um link sempre visível na tela
              disparava revalidações de fundo que derrubavam o estado do
              PainelChatDesktop (reproduzido: o efeito de montagem do chat
              limpava segundos depois de montar, assim que o prefetch de
              /panorama e /metacognicao completava — sem isso, nunca).
            */}
            <Link href={`/ler/${secaoId}/panorama`} prefetch={false} className="text-sm font-medium text-primary hover:underline">
              Ver panorama da seção
            </Link>
            <ContadorSecoes sumario={sumario} abertas={progresso.secoesAbertas} />
          </div>
          {/* Sempre acessíveis, mesmo rolando o texto (item 1.6) */}
          <div className="flex flex-wrap items-center gap-2">
            <BotaoFazerQuestoes secaoId={secaoId} />
            <BotaoGerarFichamento secaoId={secaoId} rotulo="Gerar fichamento desta seção" />
            <Link
              href={`/metacognicao/${secaoId}`}
              prefetch={false}
              className="text-sm font-medium text-primary hover:underline"
            >
              Fechar esta seção
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <GuardaPanorama secaoId={secaoId}>
      <ProvedorPerguntaTrecho>
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <BarraMobile
            sumario={<SumarioArvore nos={sumario} ativoId={secaoId} />}
            tutora={<PainelChat sessaoId={sessao.id} secaoId={secaoId} historicoInicial={historico} />}
          />

          <div className="flex flex-1 overflow-hidden">
            <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-border p-4 md:block">
              <SumarioArvore nos={sumario} ativoId={secaoId} />
            </aside>

            <InstrumentacaoLeitura secaoId={secaoId}>
              {barraAcoes}

              <div className="mx-auto mt-6 max-w-[68ch]">
                <TextoSecao texto={secao.textoCompleto} secaoId={secaoId} />
              </div>

              <div className="mx-auto mt-8 max-w-[68ch] rounded-lg border border-border bg-muted/40 p-4">
                <p className="mb-2 text-sm font-medium">Antes de seguir em frente</p>
                <ol className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                  <li>1. Faça as questões desta seção, com o botão &ldquo;Fazer questões desta seção&rdquo; acima.</li>
                  <li>
                    2. Depois,{' '}
                    <Link href={`/metacognicao/${secaoId}`} prefetch={false} className="font-medium text-primary hover:underline">
                      feche esta seção
                    </Link>{' '}
                    registrando o que aprendeu.
                  </li>
                </ol>
              </div>

              <nav className="mx-auto mt-10 flex max-w-[68ch] justify-between pb-8 text-sm">
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
              <PainelChatDesktop sessaoId={sessao.id} secaoId={secaoId} historicoInicial={historico} />
            </aside>
          </div>
        </div>
      </ProvedorPerguntaTrecho>
    </GuardaPanorama>
  );
}
