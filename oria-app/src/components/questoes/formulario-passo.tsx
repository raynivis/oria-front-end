import Link from 'next/link';
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
  campo: string;
  setCampo: (valor: string) => void;
  enviando: boolean;
  erro: string | null;
  onEnviar: () => void;
  onPedirDica: () => void;
  onVerResolucao: () => void;
  onDesistir: () => void;
};

/**
 * Estados 2, 3 e 4 (UI_RULES.md, 3.1) compartilham a mesma forma: trilha +
 * campo + botões. O que muda é derivado do último passo da API, nunca
 * decidido no cliente — inclusive se o botão de resolução existe ou não.
 */
export function FormularioPasso({
  tentativa,
  sectionId,
  campo,
  setCampo,
  enviando,
  erro,
  onEnviar,
  onPedirDica,
  onVerResolucao,
  onDesistir,
}: Props) {
  const ultimo = tentativa.passos.at(-1);
  const rotuloPasso = ultimo ? ROTULO_PASSO[ultimo.tipo] : undefined;
  const podeVerResolucao = ultimo?.tipo === 'dica_localizada';
  const rotuloDica = ultimo?.tipo === 'pedido_justificativa' ? 'Preciso de uma dica' : 'Preciso de outra dica';

  return (
    <div className="flex flex-col gap-2">
      {rotuloPasso && <p className="text-xs text-muted-foreground">{rotuloPasso}</p>}

      {ultimo?.tipo === 'dica_localizada' && (
        <Link href={`/ler/${sectionId}`} className="text-xs font-medium text-primary hover:underline">
          Ver no texto
        </Link>
      )}

      <Textarea
        aria-label="Sua resposta a este passo"
        value={campo}
        onChange={(evento) => setCampo(evento.target.value)}
        placeholder="Escreva aqui…"
        rows={2}
        disabled={enviando}
      />

      {erro && <p className="text-sm text-destructive">{erro}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={onEnviar} disabled={!campo.trim() || enviando}>
          Enviar
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onPedirDica} disabled={enviando}>
          {rotuloDica}
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
