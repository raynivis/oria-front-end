import Link from 'next/link';
import { cn } from 'cn';
import type { SumarioNo } from '@/lib/api/tipos';

export function SumarioArvore({ nos, ativoId }: { nos: SumarioNo[]; ativoId?: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {nos.map((no) => (
        <li key={no.id}>
          <NoSumario no={no} ativoId={ativoId} />
        </li>
      ))}
    </ul>
  );
}

function NoSumario({ no, ativoId }: { no: SumarioNo; ativoId?: string }) {
  if (no.filhas.length === 0) {
    return (
      <Link
        href={no.href}
        aria-current={no.id === ativoId ? 'page' : undefined}
        className={cn(
          'block rounded-md px-2 py-1.5 text-sm hover:bg-muted',
          no.id === ativoId && 'bg-muted font-medium text-foreground',
        )}
      >
        {no.titulo}
      </Link>
    );
  }

  return (
    <details open={no.nivel <= 2}>
      <summary className="cursor-pointer rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted">
        {no.titulo}
      </summary>
      <div className="ml-4 border-l border-border pl-3">
        <SumarioArvore nos={no.filhas} ativoId={ativoId} />
      </div>
    </details>
  );
}
