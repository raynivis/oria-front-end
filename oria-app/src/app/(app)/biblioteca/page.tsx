import Link from 'next/link';
import type { Metadata } from 'next';
import { BookOpen } from 'lucide-react';
import { chamarApi } from '@/lib/api/cliente';
import type { LivroSaida } from '@/lib/api/tipos';
import { Card } from '@/components/ui/card';
import { CabecalhoPagina } from '@/components/app-shell/cabecalho-pagina';

export const metadata: Metadata = { title: 'Biblioteca — Tutora Oria' };

export default async function PaginaBiblioteca() {
  const livros = await chamarApi<LivroSaida[]>('/livros');

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <CabecalhoPagina
        titulo="Minha biblioteca"
        subtitulo={livros.length === 1 ? '1 livro disponível' : `${livros.length} livros disponíveis`}
      />

      {livros.length === 0 ? (
        <p className="text-muted-foreground">Nenhum livro disponível ainda.</p>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {livros.map((livro) => (
            <li key={livro.id}>
              <Link href={`/livros/${livro.id}`}>
                <Card className="flex-row gap-4 p-4 transition-shadow hover:shadow-elevated">
                  <div className="grid h-32 w-24 shrink-0 place-items-center rounded-lg bg-soft">
                    <BookOpen className="size-6 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <h3 className="truncate font-semibold">{livro.titulo}</h3>
                    <p className="truncate text-sm text-muted-foreground">{livro.autor}</p>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
