import { AlertTriangle } from 'lucide-react';
import type { Mensagem, Citacao } from './tipos';

export function BolhaMensagem({
  mensagem,
  onClicarCitacao,
}: {
  mensagem: Mensagem;
  onClicarCitacao: (citacao: Citacao) => void;
}) {
  if (mensagem.papel === 'aluno') {
    return (
      <p className="self-end rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">{mensagem.conteudo}</p>
    );
  }

  // Estado de recusa: visivelmente diferente, sem lista de citações (UI_RULES.md, 2.4).
  if (mensagem.encontrouBase === false) {
    return (
      <div className="flex items-start gap-2 rounded-lg border-l-2 border-amber-500 bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>Não encontrei base para isso no material desta seção.</p>
      </div>
    );
  }

  if (mensagem.erro) {
    return (
      <div className="flex items-start gap-2 rounded-lg border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        <p>{mensagem.erro}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-wrap">
        {mensagem.conteudo}
        {mensagem.emAndamento && <span className="animate-pulse">▍</span>}
      </p>

      {mensagem.citacoes.length > 0 && (
        <div className="flex flex-col gap-1 px-1">
          <p className="text-xs font-medium text-muted-foreground">Trechos usados</p>
          {mensagem.citacoes.map((citacao) => (
            <button
              key={citacao.chunkId}
              type="button"
              onClick={() => onClicarCitacao(citacao)}
              className="rounded-sm px-1.5 py-1 text-left text-xs hover:bg-muted"
            >
              <span className="italic text-foreground">&ldquo;{citacao.trecho.slice(0, 48)}…&rdquo;</span>{' '}
              <span className="text-muted-foreground">{citacao.secaoTitulo}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
