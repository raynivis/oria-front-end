import Link from 'next/link';
import type { Metadata } from 'next';
import { chamarApi } from '@/lib/api/cliente';
import type { LivroSaida } from '@/lib/api/tipos';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = { title: 'Biblioteca — Tutora Oria' };

export default async function PaginaBiblioteca() {
  const livros = await chamarApi<LivroSaida[]>('/livros');

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Biblioteca</h1>

      {livros.length === 0 ? (
        <p className="text-muted-foreground">Nenhum livro disponível ainda.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {livros.map((livro) => (
            <li key={livro.id}>
              <Link href={`/livros/${livro.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle>{livro.titulo}</CardTitle>
                    <CardDescription>{livro.autor}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
