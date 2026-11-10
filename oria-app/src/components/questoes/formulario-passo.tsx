import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { TentativaSaida } from '@/lib/api/tipos';

const ROTULO_PASSO: Record<string, string> = {
  pedido_justificativa: 'Passo 1 de 3',
  dica_conceitual: 'Passo 2 de 3',
  dica_localizada: 'Passo 3 de 3',
};

type Props = {
  tentativa: TentativaSaida;
  sectionId: string;
  numeroQuestao: number;
  idEnunciado: string;
  campo: string;
  setCampo: (valor: string) => void;
  enviando: boolean;
  erro: { mensagem: string; retryable: boolean } | null;
  onEnviar: () => void;
  onVerResolucao: () => void;
  onDesistir: () => void;
};

/**
 * Estados 2, 3 e 4 (UI_RULES.md, 3.1) compartilham a mesma forma: trilha +
 * campo + botões. O que muda é derivado do último passo da API, nunca
 * decidido no cliente — inclusive se o botão de resolução existe ou não.
 *
 * Não existe "pedir dica" como ação do servidor: as dicas são emitidas
 * automaticamente quando uma justificativa é julgada insuficiente. O botão
 * que existia aqui ("Preciso de uma dica") mandava exatamente o mesmo corpo
 * que "Enviar" — e, com o campo vazio, criava um passo vazio na trilha
 * (item 3.8 da correção de usabilidade). Removido: "Enviar" já é a única
 * ação real.
 */
export function FormularioPasso({
  tentativa,
  sectionId,
  numeroQuestao,
  idEnunciado,
  campo,
  setCampo,
  enviando,
  erro,
  onEnviar,
  onVerResolucao,
  onDesistir,
}: Props) {
  const ultimo = tentativa.passos.at(-1);
  const rotuloPasso = ultimo ? ROTULO_PASSO[ultimo.tipo] : undefined;
  const podeVerResolucao = ultimo?.tipo === 'dica_localizada';
  const chunksDaDica = ultimo?.chunksMostrados ?? [];

  return (
    <div className="flex flex-col gap-2">
      {rotuloPasso && <p className="text-xs text-muted-foreground">{rotuloPasso}</p>}

      {/*
        O backend manda só o id do chunk e a posição (ancoraCfi), sem o texto
        literal — o leitor não interpreta CFI de EPUB de verdade (é texto
        puro), então "Ver no texto" abre a seção sem destacar o ponto exato.
        Avisa disso em vez de prometer um destaque que não acontece.
      */}
      {chunksDaDica.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {[...new Set(chunksDaDica.map((c) => c.sectionId ?? sectionId))].map((idSecao, indice) => (
            <a
              key={idSecao}
              href={`/ler/${idSecao}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-medium text-primary hover:underline"
            >
              Ver no texto{indice > 0 ? ` (seção ${indice + 1})` : ''}
            </a>
          ))}
        </div>
      )}

      <Textarea
        aria-label={`Sua resposta à questão ${numeroQuestao}`}
        aria-describedby={idEnunciado}
        value={campo}
        onChange={(evento) => setCampo(evento.target.value)}
        placeholder="Escreva aqui…"
        rows={2}
        disabled={enviando}
      />

      {erro && (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-destructive">{erro.mensagem}</p>
          {!erro.retryable && (
            <p className="text-xs text-muted-foreground">Tentar de novo não vai mudar o resultado — reescreva sua resposta.</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={onEnviar} disabled={!campo.trim() || enviando}>
          {erro?.retryable ? 'Tentar de novo' : 'Enviar'}
        </Button>
        {podeVerResolucao && (
          <Button type="button" size="sm" variant="secondary" onClick={onVerResolucao} disabled={enviando}>
            Ver resolução
          </Button>
        )}
        <button
          type="button"
          onClick={onDesistir}
          disabled={enviando}
          className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:underline disabled:opacity-50"
        >
          Desistir
        </button>
      </div>
    </div>
  );
}
