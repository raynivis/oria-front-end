import { describe, expect, it } from 'vitest';
import { contarPalavras, expandirParaFrase, expandirParaPalavra } from './selecao';

describe('expandirParaPalavra', () => {
  it('expande um corte no meio de uma palavra para a palavra inteira', () => {
    const texto = 'A substituição de perguntas acontece sem perceber.';
    // seleciona só "stitui" dentro de "substituição"
    const inicio = texto.indexOf('stitui');
    const fim = inicio + 'stitui'.length;
    const resultado = expandirParaPalavra(texto, inicio, fim);
    expect(texto.slice(resultado.inicio, resultado.fim)).toBe('substituição');
  });

  it('não altera uma seleção que já está em limites de palavra', () => {
    const texto = 'Heurísticas e vieses.';
    const inicio = texto.indexOf('vieses');
    const fim = inicio + 'vieses'.length;
    const resultado = expandirParaPalavra(texto, inicio, fim);
    expect(resultado).toEqual({ inicio, fim });
  });
});

describe('expandirParaFrase', () => {
  it('expande para a frase inteira a partir de uma seleção parcial', () => {
    const texto = 'Primeira frase aqui. Segunda frase com mais conteúdo. Terceira frase.';
    const inicio = texto.indexOf('mais');
    const fim = inicio + 'mais'.length;
    const resultado = expandirParaFrase(texto, inicio, fim);
    expect(texto.slice(resultado.inicio, resultado.fim)).toBe('Segunda frase com mais conteúdo.');
  });

  it('para no início do texto quando a seleção está na primeira frase', () => {
    const texto = 'Única frase sem ponto antes. Depois tem outra.';
    const resultado = expandirParaFrase(texto, 0, 6);
    expect(resultado.inicio).toBe(0);
  });
});

describe('contarPalavras', () => {
  it('conta 1 a 3 palavras para ativar o atalho de vocabulário (item 1.9)', () => {
    expect(contarPalavras('subimplantação')).toBe(1);
    expect(contarPalavras('ensino remoto emergencial')).toBe(3);
  });

  it('não ativa para seleções mais longas', () => {
    expect(contarPalavras('um trecho com mais de três palavras selecionadas')).toBeGreaterThan(3);
  });

  it('ignora espaços múltiplos e bordas', () => {
    expect(contarPalavras('  duas   palavras  ')).toBe(2);
  });
});
