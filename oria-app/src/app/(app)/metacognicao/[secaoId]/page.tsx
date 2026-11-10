import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { chamarApi, redirecionarSeSessaoExpirada } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { ConceitosDoAlunoSaida, ConjuntoResumo, SecaoSaida } from '@/lib/api/tipos';
import { FormularioMetacognicao } from '@/components/metacognicao/formulario';
import { ListasConceitos } from '@/components/conceitos/listas';

type ParametrosPagina = { params: Promise<{ secaoId: string }> };

async function buscarOu404(secaoId: string) {
  try {
    const [secao, conceitos] = await Promise.all([
      chamarApi<SecaoSaida>(`/secoes/${secaoId}`),
      chamarApi<ConceitosDoAlunoSaida>('/me/conceitos'),
    ]);

    // Item 3.1/3.6: antes de registrar, avisar se o aluno ainda não fez nenhuma
    // questão desta seção — não bloqueia, só pergunta.
    let temQuestaoConcluida = true;
    try {
      const resumos = await chamarApi<ConjuntoResumo[]>('/me/conjuntos');
      const daSecao = resumos.filter((r) => r.sectionId === secaoId);
      temQuestaoConcluida = daSecao.length === 0 ? false : daSecao.some((r) => r.questoes.some((q) => q.estado === 'resolvida'));
    } catch {
      temQuestaoConcluida = true; // sem dado, não bloqueia nem avisa à toa
    }

    return { secao, conceitos, temQuestaoConcluida };
  } catch (erro) {
    if (erro instanceof ErroApiCliente && erro.statusCode === 404) {
      notFound();
    }
    redirecionarSeSessaoExpirada(erro);
    throw erro;
  }
}

export const metadata: Metadata = { title: 'Fechamento da seção — Tutora Oria' };

export default async function PaginaMetacognicao({ params }: ParametrosPagina) {
  const { secaoId } = await params;
  const { secao, conceitos, temQuestaoConcluida } = await buscarOu404(secaoId);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <p className="text-sm text-muted-foreground">{secao.titulo}</p>
      <h1 className="mb-6 text-2xl font-semibold">Fechamento da seção</h1>

      <FormularioMetacognicao secaoId={secaoId} temQuestaoConcluida={temQuestaoConcluida} />

      <hr className="my-8 border-border" />

      <ListasConceitos dominados={conceitos.dominados} aRevisar={conceitos.aRevisar} />
    </main>
  );
}
