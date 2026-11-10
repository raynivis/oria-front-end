/**
 * Funções puras de ajuste de seleção de texto (item 2.3 da correção de
 * usabilidade): ajustar à palavra inteira (sempre) e expandir até a frase
 * (sob pedido, botão "Expandir até a frase"). Operam sobre o texto completo
 * da seção (parágrafos unidos por "\n\n") e um intervalo [inicio, fim).
 */

const RE_CARACTERE_PALAVRA = /[\p{L}\p{N}'-]/u;

export function expandirParaPalavra(texto: string, inicio: number, fim: number): { inicio: number; fim: number } {
  let i = inicio;
  while (i > 0 && RE_CARACTERE_PALAVRA.test(texto[i - 1])) i--;
  let j = fim;
  while (j < texto.length && RE_CARACTERE_PALAVRA.test(texto[j])) j++;
  return { inicio: i, fim: j };
}

const PONTUACAO_FINAL = new Set(['.', '!', '?']);

export function expandirParaFrase(texto: string, inicio: number, fim: number): { inicio: number; fim: number } {
  let i = inicio;
  while (i > 0 && !PONTUACAO_FINAL.has(texto[i - 1])) i--;
  while (i < fim && /\s/.test(texto[i])) i++;
  let j = fim;
  while (j < texto.length && !PONTUACAO_FINAL.has(texto[j])) j++;
  if (j < texto.length) j++;
  return { inicio: i, fim: j };
}

/** 1 a 3 palavras ativa o atalho de dedução de vocabulário (item 1.9) como opção principal. */
export function contarPalavras(trecho: string): number {
  return trecho.trim().split(/\s+/).filter(Boolean).length;
}
