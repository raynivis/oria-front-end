import Link from 'next/link';
import type { ConceitoClassificado } from '@/lib/api/tipos';

/**
 * Conceito sem tentativa registrada não aparece em lista nenhuma — a API já
 * faz esse corte (UI_RULES.md, seção 6). Não preenchemos com placeholder.
 */
export function ListasConceitos({
  dominados,
  aRevisar,
}: {
  dominados: ConceitoClassificado[];
  aRevisar: ConceitoClassificado[];
}) {
  if (dominados.length === 0 && aRevisar.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {dominados.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Conceitos dominados</p>
          <div className="flex flex-wrap gap-2">
            {dominados.map((conceito) => (
              <span
                key={conceito.conceitoId}
                className="rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground"
              >
                {conceito.nome}
              </span>
            ))}
          </div>
        </div>
      )}

      {aRevisar.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-muted-foreground">Conceitos para revisar</p>
          <div className="flex flex-wrap gap-2">
            {aRevisar.map((conceito) => (
              <Link
                key={conceito.conceitoId}
                href={`/ler/${conceito.sectionId}`}
                className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground hover:bg-accent/80"
              >
                {conceito.nome}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
