/**
 * Parser de markdown em blocos, só o suficiente para o que o prompt de
 * fichamento de fato emite (item 2.2 da correção de usabilidade): títulos
 * `#`..`######`, listas com `-`/`*` ou `1.`, e parágrafos. Não cobre ênfase
 * inline (negrito/itálico) — não foi reportado como problema e o editor
 * continua restrito a texto simples dentro de cada bloco.
 */

export type BlocoFichamento =
  | { tipo: 'paragrafo'; texto: string }
  | { tipo: 'titulo'; nivel: number; texto: string }
  | { tipo: 'lista'; ordenada: boolean; itens: string[] };

const RE_TITULO = /^(#{1,6})\s+(.*)$/;
const RE_ITEM_NAO_ORDENADO = /^[-*]\s+(.*)$/;
const RE_ITEM_ORDENADO = /^\d+[.)]\s+(.*)$/;

export function analisarMarkdown(markdown: string): BlocoFichamento[] {
  const linhas = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocos: BlocoFichamento[] = [];
  let paragrafoAtual: string[] = [];
  let listaAtual: { ordenada: boolean; itens: string[] } | null = null;

  function fecharParagrafo() {
    if (paragrafoAtual.length > 0) {
      blocos.push({ tipo: 'paragrafo', texto: paragrafoAtual.join(' ').trim() });
      paragrafoAtual = [];
    }
  }

  function fecharLista() {
    if (listaAtual && listaAtual.itens.length > 0) {
      blocos.push({ tipo: 'lista', ordenada: listaAtual.ordenada, itens: listaAtual.itens });
    }
    listaAtual = null;
  }

  for (const linhaBruta of linhas) {
    const linha = linhaBruta.trimEnd();

    if (linha.trim() === '') {
      fecharParagrafo();
      fecharLista();
      continue;
    }

    const titulo = linha.match(RE_TITULO);
    if (titulo) {
      fecharParagrafo();
      fecharLista();
      blocos.push({ tipo: 'titulo', nivel: titulo[1].length, texto: titulo[2].trim() });
      continue;
    }

    const itemNaoOrdenado = linha.match(RE_ITEM_NAO_ORDENADO);
    const itemOrdenado = linha.match(RE_ITEM_ORDENADO);
    if (itemNaoOrdenado || itemOrdenado) {
      fecharParagrafo();
      const ordenada = Boolean(itemOrdenado);
      const texto = (itemNaoOrdenado ?? itemOrdenado)![1].trim();
      if (!listaAtual || listaAtual.ordenada !== ordenada) {
        fecharLista();
        listaAtual = { ordenada, itens: [] };
      }
      listaAtual.itens.push(texto);
      continue;
    }

    fecharLista();
    paragrafoAtual.push(linha.trim());
  }

  fecharParagrafo();
  fecharLista();

  if (blocos.length === 0) blocos.push({ tipo: 'paragrafo', texto: '' });
  return blocos;
}

/** Texto plano de um bloco, usado para a comparação de origem (IA × aluno) e para busca. */
export function textoDoBloco(bloco: BlocoFichamento): string {
  if (bloco.tipo === 'lista') return bloco.itens.join(' | ');
  return bloco.texto;
}

/** Serializa os blocos de volta para markdown — o formato salvo via PATCH. */
export function serializarBlocos(blocos: BlocoFichamento[]): string {
  return blocos
    .map((bloco) => {
      if (bloco.tipo === 'titulo') return `${'#'.repeat(bloco.nivel)} ${bloco.texto}`;
      if (bloco.tipo === 'lista') {
        return bloco.itens
          .map((item, indice) => (bloco.ordenada ? `${indice + 1}. ${item}` : `- ${item}`))
          .join('\n');
      }
      return bloco.texto;
    })
    .join('\n\n');
}
