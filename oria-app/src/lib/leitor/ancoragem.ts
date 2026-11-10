/**
 * Utilitário único de ancoragem a uma posição no texto da seção, usado pelos
 * três pontos que precisam disso (UI_RULES.md / correção de usabilidade
 * 1.11, 2.4 e 3.9): clique numa citação do chat, "Ver no texto" do
 * fichamento, e "Ver no texto" de um chunk mostrado numa dica.
 *
 * O leitor não é um epub.js real — é texto puro por parágrafo. Por isso a
 * ancoragem não interpreta a sintaxe de CFI do EPUB (`epubcfi(/6/14!/4/2/2)`
 * vindo do backend não tem como ser resolvida contra uma árvore que não
 * existe aqui); em vez disso localizamos o PRÓPRIO TRECHO LITERAL no texto
 * renderizado. É uma resolução por correspondência de texto, não por CFI —
 * suficiente para o que a interface oferece, e documentado como tal.
 */

const PREFIXO_DESTAQUE = 'oria-destaque-ancora';

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Acha o primeiro parágrafo (por índice) cujo texto contém o trecho — exato primeiro, depois normalizado. */
export function localizarTrechoNosParagrafos(
  paragrafos: string[],
  trechoTexto: string,
): { indiceParagrafo: number; exato: boolean } | null {
  const alvo = trechoTexto.trim();
  if (!alvo) return null;

  for (let i = 0; i < paragrafos.length; i++) {
    if (paragrafos[i].includes(alvo)) return { indiceParagrafo: i, exato: true };
  }

  const alvoNormalizado = normalizar(alvo);
  for (let i = 0; i < paragrafos.length; i++) {
    if (normalizar(paragrafos[i]).includes(alvoNormalizado)) return { indiceParagrafo: i, exato: false };
  }

  return null;
}

function limparDestaqueAnterior(container: HTMLElement): void {
  container.querySelectorAll('mark[data-citacao]').forEach((mark) => {
    const pai = mark.parentNode;
    if (!pai) return;
    pai.replaceChild(document.createTextNode(mark.textContent ?? ''), mark);
    pai.normalize();
  });
  container.querySelectorAll(`[data-${PREFIXO_DESTAQUE}]`).forEach((el) => {
    el.removeAttribute(`data-${PREFIXO_DESTAQUE}`);
    el.classList.remove('bg-accent/40');
  });
}

function marcarIntervalo(paragrafo: HTMLElement, inicio: number, fim: number): boolean {
  const no = paragrafo.firstChild;
  if (!no || no.nodeType !== Node.TEXT_NODE) return false;

  const range = document.createRange();
  range.setStart(no, inicio);
  range.setEnd(no, fim);

  const mark = document.createElement('mark');
  mark.dataset.citacao = 'true';
  mark.className = 'rounded-sm bg-accent text-accent-foreground';
  range.surroundContents(mark);
  return true;
}

/**
 * Ancora (rola e destaca) o trecho dentro do container de texto da seção já
 * montado na tela. Use só quando a seção é a que já está aberta — para
 * seção diferente, navegue primeiro (ver `urlComDestaque`).
 */
export function ancorarTrechoNoTexto(trechoTexto: string, containerId = 'texto-secao'): boolean {
  const container = document.getElementById(containerId);
  if (!container) return false;

  limparDestaqueAnterior(container);

  const trecho = trechoTexto.trim();
  if (!trecho) return false;

  const paragrafos = Array.from(container.querySelectorAll<HTMLParagraphElement>('p[data-indice]'));

  for (const paragrafo of paragrafos) {
    const original = paragrafo.textContent ?? '';
    const indiceExato = original.indexOf(trecho);

    if (indiceExato !== -1 && marcarIntervalo(paragrafo, indiceExato, indiceExato + trecho.length)) {
      paragrafo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }

    if (normalizar(original).includes(normalizar(trecho))) {
      paragrafo.dataset[PREFIXO_DESTAQUE] = 'true';
      paragrafo.classList.add('bg-accent/40');
      paragrafo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
  }

  return false;
}

const PARAMETRO_URL = 'destacar';

/** Monta a URL do leitor de outra seção já com o trecho a destacar ao abrir. */
export function urlComDestaque(sectionId: string, trechoTexto: string): string {
  return `/ler/${sectionId}?${PARAMETRO_URL}=${encodeURIComponent(trechoTexto)}`;
}

export function lerTrechoDestacadoDaUrl(searchParams: URLSearchParams): string | null {
  return searchParams.get(PARAMETRO_URL);
}
