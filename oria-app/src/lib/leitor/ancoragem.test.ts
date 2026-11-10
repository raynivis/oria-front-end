import { describe, expect, it } from 'vitest';
import { localizarTrechoNosParagrafos, urlComDestaque } from './ancoragem';

describe('localizarTrechoNosParagrafos', () => {
  const paragrafos = [
    'Primeiro parágrafo com uma ideia introdutória sobre o tema.',
    'Segundo parágrafo que fala sobre substituição de perguntas e heurísticas.',
    'Terceiro parágrafo de fechamento.',
  ];

  it('acha o parágrafo por correspondência exata', () => {
    const resultado = localizarTrechoNosParagrafos(paragrafos, 'substituição de perguntas');
    expect(resultado).toEqual({ indiceParagrafo: 1, exato: true });
  });

  it('acha por correspondência normalizada quando a pontuação/acentos divergem', () => {
    const resultado = localizarTrechoNosParagrafos(paragrafos, 'SUBSTITUICAO DE PERGUNTAS');
    expect(resultado?.indiceParagrafo).toBe(1);
    expect(resultado?.exato).toBe(false);
  });

  it('devolve null quando o trecho não existe em nenhum parágrafo', () => {
    expect(localizarTrechoNosParagrafos(paragrafos, 'frase que não está no texto')).toBeNull();
  });

  it('devolve null para um trecho vazio', () => {
    expect(localizarTrechoNosParagrafos(paragrafos, '   ')).toBeNull();
  });
});

describe('urlComDestaque', () => {
  it('monta a URL do leitor com o trecho codificado na querystring', () => {
    const url = urlComDestaque('sec-1-1', 'um trecho com espaços & símbolos');
    expect(url).toBe('/ler/sec-1-1?destacar=um%20trecho%20com%20espa%C3%A7os%20%26%20s%C3%ADmbolos');
  });
});
