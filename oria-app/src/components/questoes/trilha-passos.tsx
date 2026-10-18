import type { TentativaSaida } from '@/lib/api/tipos';

/**
 * A trilha fica sempre visível (UI_RULES.md, 3.2) — e nunca com cor, ícone
 * ou texto de veredito, nem mesmo no passo de resolução. A mesma aparência
 * vale para resposta certa ou errada.
 */
const RUBRICAS: Record<string, string> = {
  pedido_justificativa: 'Tutora',
  dica_conceitual: 'Tutora · dica',
  dica_localizada: 'Tutora · dica',
  justificativa_aluno: 'Você',
  resolucao: 'Resolução',
};

export function TrilhaPassos({ passos }: { passos: TentativaSaida['passos'] }) {
  return (
    <div className="flex flex-col gap-2">
      {passos.map((passo) => {
        const doAluno = passo.tipo === 'justificativa_aluno';
        return (
          <div key={passo.numero} className={doAluno ? 'flex justify-end' : 'flex justify-start'}>
            <div
              className={
                doAluno
                  ? 'max-w-[85%] rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground'
                  : 'max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm'
              }
            >
              <p className={doAluno ? 'mb-0.5 text-xs text-primary-foreground/70' : 'mb-0.5 text-xs text-muted-foreground'}>
                {RUBRICAS[passo.tipo]}
              </p>
              {passo.conteudo}
            </div>
          </div>
        );
      })}
    </div>
  );
}
