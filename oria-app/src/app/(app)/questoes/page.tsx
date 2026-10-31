import Link from 'next/link';
import type { Metadata } from 'next';
import { chamarApi, redirecionarSeSessaoExpirada } from '@/lib/api/cliente';
import type { ConjuntoResumo } from '@/lib/api/tipos';
import { ROTULO_ESTADO } from '@/lib/questoes/estado-rotulo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CabecalhoPagina } from '@/components/app-shell/cabecalho-pagina';

export const metadata: Metadata = { title: 'Questões — Tutora Oria' };

async function buscarConjuntos(): Promise<ConjuntoResumo[]> {
  try {
    return await chamarApi<ConjuntoResumo[]>('/me/conjuntos');
  } catch (erro) {
    redirecionarSeSessaoExpirada(erro);
    throw erro;
  }
}

export default async function PaginaQuestoesIndice() {
  const conjuntos = await buscarConjuntos();
  const ordenados = [...conjuntos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <CabecalhoPagina
        titulo="Questões"
        subtitulo={conjuntos.length === 1 ? '1 conjunto de questões' : `${conjuntos.length} conjuntos de questões`}
      />

      {ordenados.length === 0 ? (
        <p className="text-muted-foreground">
          Nenhum questionário ainda. Gere um a partir de uma seção no leitor.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {ordenados.map((conjunto) => {
            const concluidas = conjunto.questoes.filter((q) => q.estado === 'resolvida').length;
            return (
              <li key={conjunto.id}>
                <Link href={`/questoes/${conjunto.id}`}>
                  <Card className="transition-shadow hover:shadow-elevated">
                    <CardHeader>
                      <CardTitle>{conjunto.tituloSecao}</CardTitle>
                      <CardDescription>{conjunto.tituloLivro}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      <p className="text-sm text-muted-foreground">
                        {concluidas} de {conjunto.questoes.length} concluídas
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {conjunto.questoes.map((questao, indice) => (
                          <span
                            key={questao.id}
                            className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
                          >
                            Q{indice + 1} · {ROTULO_ESTADO[questao.estado]}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
