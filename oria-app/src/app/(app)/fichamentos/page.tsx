import Link from 'next/link';
import type { Metadata } from 'next';
import { chamarApi, redirecionarSeSessaoExpirada } from '@/lib/api/cliente';
import type { FichamentoResumoDto } from '@/lib/api/tipos';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { CabecalhoPagina } from '@/components/app-shell/cabecalho-pagina';

export const metadata: Metadata = { title: 'Fichamentos — Tutora Oria' };

type ParametrosPagina = { searchParams: Promise<{ texto?: string; sectionId?: string }> };

/** Busca e filtro (item 2.6) são parâmetros aceitos pela própria listagem; cada submit é uma navegação GET normal. */
async function buscarFichamentos(filtros: { texto?: string; sectionId?: string }): Promise<FichamentoResumoDto[]> {
  try {
    const parametros = new URLSearchParams();
    if (filtros.texto) parametros.set('texto', filtros.texto);
    if (filtros.sectionId) parametros.set('sectionId', filtros.sectionId);
    const consulta = parametros.toString();
    return await chamarApi<FichamentoResumoDto[]>(`/me/fichamentos${consulta ? `?${consulta}` : ''}`);
  } catch (erro) {
    redirecionarSeSessaoExpirada(erro);
    throw erro;
  }
}

export default async function PaginaFichamentos({ searchParams }: ParametrosPagina) {
  const filtros = await searchParams;
  const fichamentos = await buscarFichamentos(filtros);

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

      <form className="mb-6 flex gap-2" action="/fichamentos" method="get">
        <Input
          type="search"
          name="texto"
          defaultValue={filtros.texto ?? ''}
          placeholder="Buscar por texto…"
          aria-label="Buscar fichamentos por texto"
          className="max-w-xs"
        />
        {filtros.sectionId && <input type="hidden" name="sectionId" value={filtros.sectionId} />}
        <button type="submit" className="rounded-lg border border-border px-3 text-sm hover:bg-muted">
          Buscar
        </button>
        {(filtros.texto || filtros.sectionId) && (
          <Link href="/fichamentos" className="self-center text-sm text-muted-foreground hover:underline">
            Limpar filtro
          </Link>
        )}
      </form>

      {fichamentos.length === 0 ? (
        <p className="text-muted-foreground">
          {filtros.texto || filtros.sectionId ? 'Nenhum fichamento encontrado para esse filtro.' : 'Nenhum fichamento ainda.'}
        </p>
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
                  <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{fichamento.editado ? 'Editado por você' : 'Gerado pela IA'}</span>
                    {fichamento.trechoPreview && <span className="truncate italic">&ldquo;{fichamento.trechoPreview}&rdquo;</span>}
                    <span>{new Date(fichamento.criadoEm ?? fichamento.atualizadoEm).toLocaleDateString('pt-BR')}</span>
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
