/**
 * Salto por correspondência de texto, sem CFI (UI_RULES.md, seção 2.3):
 * normaliza, acha a primeira ocorrência, envolve em <mark> e rola até lá.
 * Se não achar, não quebra — só não destaca.
 */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function limparDestaqueAnterior(container: HTMLElement): void {
  container.querySelectorAll('mark[data-citacao]').forEach((mark) => {
    const pai = mark.parentNode;
    if (!pai) return;
    pai.replaceChild(document.createTextNode(mark.textContent ?? ''), mark);
    pai.normalize();
  });
  container.querySelectorAll('[data-citacao-paragrafo]').forEach((el) => {
    el.removeAttribute('data-citacao-paragrafo');
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

export function destacarCitacaoNoTexto(trecho: string): boolean {
  const container = document.getElementById('texto-secao');
  if (!container) return false;

  limparDestaqueAnterior(container);

  const trechoNormalizado = normalizar(trecho);
  if (!trechoNormalizado) return false;

  const paragrafos = Array.from(container.querySelectorAll<HTMLParagraphElement>('p[data-indice]'));

  for (const paragrafo of paragrafos) {
    const original = paragrafo.textContent ?? '';
    const indiceExato = original.indexOf(trecho);

    if (indiceExato !== -1 && marcarIntervalo(paragrafo, indiceExato, indiceExato + trecho.length)) {
      paragrafo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }

    if (normalizar(original).includes(trechoNormalizado)) {
      paragrafo.dataset.citacaoParagrafo = 'true';
      paragrafo.classList.add('bg-accent/40');
      paragrafo.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return true;
    }
  }

  return false;
}
