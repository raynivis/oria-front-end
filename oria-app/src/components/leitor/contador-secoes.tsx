import type { SumarioNo } from '@/lib/api/tipos';

function folhasDoSumario(nos: SumarioNo[]): string[] {
  return nos.flatMap((no) => (no.filhas.length === 0 ? [no.id] : folhasDoSumario(no.filhas)));
}

/**
 * "X de Y seções abertas" (UI_RULES.md, seção 1.4) — nunca percentual. `abertas`
 * vem de `GET /me/progresso` (`secoesAbertas`), a MESMA fonte usada pelo card
 * "Seções abertas" do Início — antes esta tela calculava sozinha a partir de
 * telemetria local, o que produzia um número diferente do Início para a
 * mesma coisa (item 1.3 da correção de usabilidade). O total de folhas vem
 * do sumário, já carregado.
 */
export function ContadorSecoes({ sumario, abertas }: { sumario: SumarioNo[]; abertas: number }) {
  const folhas = folhasDoSumario(sumario);

  return (
    <p className="text-sm text-muted-foreground">
      {abertas} de {folhas.length} seções abertas
    </p>
  );
}
