import Link from 'next/link';
import type { Metadata } from 'next';
import { chamarApi } from '@/lib/api/cliente';
import type { FichamentoResumoDto } from '@/lib/api/tipos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CabecalhoPagina } from '@/components/app-shell/cabecalho-pagina';

export const metadata: Metadata = { title: 'Fichamentos — Tutora Oria' };

export default async function PaginaFichamentos() {
  const fichamentos = await chamarApi<FichamentoResumoDto[]>('/me/fichamentos');

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <CabecalhoPagina
        titulo="Fichamentos"
        subtitulo={fichamentos.length === 1 ? '1 fichamento' : `${fichamentos.length} fichamentos`}
        acao={
          // Rota de API que devolve um download, não uma página — <Link> faria uma transição de SPA errada aqui.
          // Só markdown — UI_RULES.md 4.4 proíbe oferecer PDF.
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a href="/api/fichamentos/exportar" className="text-sm font-medium text-primary hover:underline">
            Exportar (markdown)
          </a>
        }
      />

      {fichamentos.length === 0 ? (
        <p className="text-muted-foreground">Nenhum fichamento ainda.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {fichamentos.map((fichamento) => (
            <li key={fichamento.id}>
              <Link href={`/fichamentos/${fichamento.id}`}>
                <Card className="transition-shadow hover:shadow-elevated">
                  <CardHeader>
                    <CardTitle>{fichamento.tituloSecao}</CardTitle>
                    <CardDescription>
                      {fichamento.tituloLivro}
                      {fichamento.trechoCfi ? ' · trecho' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {fichamento.editado ? 'Editado por você' : 'Gerado pela IA'}
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
