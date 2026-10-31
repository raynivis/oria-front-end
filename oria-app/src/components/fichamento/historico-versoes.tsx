import type { FichamentoVersaoSaida } from '@/lib/api/tipos';

export function HistoricoVersoes({ versoes }: { versoes: FichamentoVersaoSaida[] }) {
  const ordenadas = [...versoes].sort((a, b) => b.numero - a.numero);

  return (
    <section className="mt-10">
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">Histórico de versões</h2>
      <ol className="flex flex-col gap-2">
        {ordenadas.map((versao) => (
          <li key={versao.numero}>
            <details className="rounded-md border border-border px-3 py-2">
              <summary className="cursor-pointer text-sm">
                Versão {versao.numero} · {versao.origem === 'ia' ? 'gerada pela IA' : 'editada por você'} ·{' '}
                {new Date(versao.criadoEm).toLocaleString('pt-BR')}
              </summary>
              <div className="mt-2 text-sm whitespace-pre-wrap text-muted-foreground">{versao.conteudo}</div>
            </details>
          </li>
        ))}
      </ol>
    </section>
  );
}
