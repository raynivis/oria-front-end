import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { cn } from 'cn';
import type { ProgressoSaida } from '@/lib/api/tipos';

const ESTILO_PADRAO = 'inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline';
const ESTILO_DESTAQUE =
  'inline-flex items-center gap-2 rounded-lg bg-gradient-hero-surface px-4 py-2.5 text-sm font-semibold text-gradient-hero-surface-foreground hover:bg-gradient-hero-surface/90';

/**
 * `ultimaSecaoLida` vem de `GET /me/progresso` (item 1.4 da correção de
 * usabilidade) — antes era reconstruída no cliente via `localStorage`, que
 * não existe no primeiro acesso de um dispositivo novo nem sincroniza entre
 * dispositivos. Vindo nulo, o rótulo muda para "Escolher um livro": não faz
 * sentido convidar a "continuar" uma leitura que nunca começou.
 */
export function BotaoContinuarLeitura({
  ultimaSecaoLida,
  destaque = false,
}: {
  ultimaSecaoLida: NonNullable<ProgressoSaida['ultimaSecaoLida']> | null | undefined;
  destaque?: boolean;
}) {
  const rotulo = ultimaSecaoLida ? `Continuar: ${ultimaSecaoLida.tituloSecao}` : 'Escolher um livro';

  return (
    <Link
      href={ultimaSecaoLida ? `/ler/${ultimaSecaoLida.sectionId}` : '/biblioteca'}
      className={cn(destaque ? ESTILO_DESTAQUE : ESTILO_PADRAO)}
    >
      {destaque && <BookOpen className="size-4" />}
      {rotulo} {!destaque && '→'}
    </Link>
  );
}
