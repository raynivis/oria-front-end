import type { ReactNode } from 'react';

export function CabecalhoPagina({
  titulo,
  subtitulo,
  acao,
}: {
  titulo: string;
  subtitulo?: string;
  acao?: ReactNode;
}) {
  return (
    <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight md:text-3xl">{titulo}</h1>
        {subtitulo && <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  );
}
