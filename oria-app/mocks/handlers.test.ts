import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { server } from './server';
import { livrosFixture } from './fixtures/livros';
import { sumarioFixture } from './fixtures/sumario';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('mocks do catálogo', () => {
  it('GET /livros responde com o fixture', async () => {
    const resposta = await fetch('http://localhost:3000/api/v1/livros');
    expect(resposta.status).toBe(200);
    await expect(resposta.json()).resolves.toEqual(livrosFixture);
  });

  it('GET /livros/:id/sumario responde com os três capítulos e duas subseções cada', async () => {
    const resposta = await fetch('http://localhost:3000/api/v1/livros/livro-1/sumario');
    const sumario = await resposta.json();
    expect(sumario).toEqual(sumarioFixture);
    expect(sumario).toHaveLength(3);
    for (const capitulo of sumario) {
      expect(capitulo.filhas).toHaveLength(2);
    }
  });
});
