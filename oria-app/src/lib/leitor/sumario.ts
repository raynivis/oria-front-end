import type { SumarioNo } from '@/lib/api/tipos';

/** Sobe a árvore do sumário até achar o título do capítulo (nível 1) que contém `secaoId`. */
export function encontrarCapituloAncestral(
  nos: SumarioNo[],
  secaoId: string,
  capituloAtual?: string,
): string | null {
  for (const no of nos) {
    const rotulo = no.nivel === 1 ? no.titulo : capituloAtual;
    if (no.id === secaoId) return rotulo ?? null;

    const encontrado = encontrarCapituloAncestral(no.filhas, secaoId, rotulo);
    if (encontrado) return encontrado;
  }
  return null;
}
