import type { LivroSaida } from '@/lib/api/tipos';

export const livroMenteEDecisao: LivroSaida = {
  id: 'livro-1',
  titulo: 'Mente e Decisão',
  autor: 'Marina Studart Costa',
  isbn: '978-65-00-00000-0',
  criadoEm: '2026-02-10T09:00:00.000Z',
};

export const livrosFixture: LivroSaida[] = [livroMenteEDecisao];
