import { AlertTriangle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Mensagem, Citacao } from './tipos';

const ROTULO_SUGESTAO: Record<string, string> = {
  buscar_outras_secoes: 'Procurar em outras seções',
  abrir_glossario: 'Ver a seção relacionada',
  inferir_pelo_contexto: 'Tentar inferir pelo contexto',
};

export function BolhaMensagem({
  mensagem,
  onClicarCitacao,
  onClicarSugestao,
  onTentarDeNovo,
}: {
  mensagem: Mensagem;
  onClicarCitacao: (citacao: Citacao) => void;
  onClicarSugestao: (indice: number) => void;
  onTentarDeNovo: () => void;
}) {
  if (mensagem.papel === 'aluno') {
    return (
      <p className="self-end rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">{mensagem.conteudo}</p>
    );
  }

  // Estado explícito de carregamento antes do primeiro token (item 1.7 da correção de usabilidade).
  if (mensagem.emAndamento && !mensagem.conteudo) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        <Search className="size-3.5 animate-pulse" />
        Procurando no texto…
      </div>
    );
  }

  if (mensagem.erro) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>{mensagem.erro}</p>
        </div>
        {mensagem.perguntaOriginal && (
          <Button type="button" size="xs" variant="outline" className="self-start" onClick={onTentarDeNovo}>
            Tentar de novo
          </Button>
        )}
      </div>
    );
  }

  // Estado de recusa: visivelmente diferente, sem lista de citações (UI_RULES.md, 2.4).
  if (mensagem.encontrouBase === false) {
    return (
      <div className="flex flex-col gap-2 rounded-lg border-l-2 border-amber-500 bg-amber-100 px-3 py-2 text-sm text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>Não encontrei base para isso no material desta seção.</p>
        </div>
        {/* Nunca termina em tela sem saída (item 1.1): cada sugestão já dispara a ação. */}
        {mensagem.sugestoes && mensagem.sugestoes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {mensagem.sugestoes.map((sugestao, indice) => (
              <Button
                key={indice}
                type="button"
                size="xs"
                variant="outline"
                onClick={() => onClicarSugestao(indice)}
              >
                {sugestao.descricao || ROTULO_SUGESTAO[sugestao.tipo] || 'Ver opções'}
              </Button>
            ))}
          </div>
        )}
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
