'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Copy, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BotaoReporte } from '@/components/reportes/botao';
import { urlComDestaque } from '@/lib/leitor/ancoragem';
import type { FichamentoSaida } from '@/lib/api/tipos';

/**
 * Cabeçalho da ficha (item 2.4): título do livro e da seção, o trecho
 * original quando a ficha é de um trecho (não da seção inteira), link "Ver
 * no texto" e uma referência pronta para copiar. "Exportar esta ficha" e
 * "Copiar" (item 2.9) ficam no topo, nesta mesma barra.
 *
 * Todos os campos novos do contrato são opcionais: numa API mais antiga sem
 * eles, o cabeçalho cai para o que já existia (só o título genérico e o %).
 */
export function CabecalhoFicha({ fichamento }: { fichamento: FichamentoSaida }) {
  const [referenciaCopiada, setReferenciaCopiada] = useState(false);
  const [conteudoCopiado, setConteudoCopiado] = useState(false);

  const referencia = [fichamento.tituloLivro, fichamento.tituloSecao].filter(Boolean).join(' — ');

  async function copiar(texto: string, aoCopiar: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(texto);
      aoCopiar(true);
      setTimeout(() => aoCopiar(false), 2000);
    } catch {
      // Sem permissão de clipboard — não é crítico, só não dá o feedback visual.
    }
  }

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">{fichamento.tituloSecao ?? 'Fichamento'}</h1>
          {fichamento.tituloLivro && <p className="text-sm text-muted-foreground">{fichamento.tituloLivro}</p>}
        </div>
        <div className="flex items-center gap-1">
          <p className="text-sm text-muted-foreground">
            {Math.round(fichamento.proporcaoAluno * 100)}% do texto atual é seu
          </p>
          <BotaoReporte alvoTipo="fichamento" alvoId={fichamento.id} />
        </div>
      </div>

      {fichamento.trechoTexto && (
        <blockquote className="border-l-2 border-border pl-3 text-sm text-muted-foreground italic">
          “{fichamento.trechoTexto}”
        </blockquote>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {fichamento.trechoTexto && (
          <Link
            href={urlComDestaque(fichamento.sectionId, fichamento.trechoTexto)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver no texto
          </Link>
        )}
        <Button
          variant="outline"
          size="xs"
          render={<a href={`/api/fichamentos/${fichamento.id}/exportar`} />}
        >
          <Download />
          Exportar esta ficha
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => copiar(fichamento.conteudo, setConteudoCopiado)}
        >
          {conteudoCopiado ? <Check /> : <Copy />}
          {conteudoCopiado ? 'Copiado' : 'Copiar'}
        </Button>
        {referencia && (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => copiar(referencia, setReferenciaCopiada)}
          >
            {referenciaCopiada ? <Check /> : <Copy />}
            {referenciaCopiada ? 'Referência copiada' : 'Copiar referência'}
          </Button>
        )}
      </div>
    </div>
  );
}
