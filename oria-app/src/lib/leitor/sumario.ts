import type { SumarioNo } from '@/lib/api/tipos';

/**
 * Sobe a árvore do sumário até achar o título do capítulo (nível 1) que
 * contém `secaoId` — null se a própria seção já é de nível 1 (sumário
 * plano, sem capítulos agrupando subseções, como o livro real ingerido:
 * aí ela não tem um "capítulo" diferente de si mesma para mostrar).
 */
export function encontrarCapituloAncestral(
  nos: SumarioNo[],
  secaoId: string,
  capituloAtual?: string,
): string | null {
  for (const no of nos) {
    if (no.id === secaoId) {
      return no.nivel === 1 ? null : capituloAtual ?? null;
    }

    const proximoRotulo = no.nivel === 1 ? no.titulo : capituloAtual;
    const encontrado = encontrarCapituloAncestral(no.filhas, secaoId, proximoRotulo);
    if (encontrado !== null) return encontrado;
  }
  return null;
}
