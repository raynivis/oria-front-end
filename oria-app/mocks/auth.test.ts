import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { server } from './server';

const BASE = 'http://localhost:3000/api/v1';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('mocks de autenticação', () => {
  it('registra um e-mail novo e devolve token + user', async () => {
    const resposta = await fetch(`${BASE}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Teste da Silva', email: 'teste@exemplo.com', senha: '12345678' }),
    });
    expect(resposta.status).toBe(201);
    const dados = await resposta.json();
    expect(dados.token).toBeTruthy();
    expect(dados.user).toMatchObject({ nome: 'Teste da Silva', email: 'teste@exemplo.com' });
    expect(dados.user.senha).toBeUndefined();
  });

  it('recusa registro com e-mail já cadastrado', async () => {
    const resposta = await fetch(`${BASE}/auth/registro`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'Outra Pessoa', email: 'aluna@exemplo.com', senha: '12345678' }),
    });
    expect(resposta.status).toBe(409);
    const corpo = await resposta.json();
    expect(corpo.message).toBe('E-mail já cadastrado.');
  });

  it('autentica o usuário semeado e expõe o perfil em GET /me', async () => {
    const login = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aluna@exemplo.com', senha: 'senha1234' }),
    });
    expect(login.status).toBe(200);
    const { token, user } = await login.json();

    const perfil = await fetch(`${BASE}/me`, { headers: { Authorization: `Bearer ${token}` } });
    expect(perfil.status).toBe(200);
    await expect(perfil.json()).resolves.toEqual(user);
  });

  it('recusa login com senha errada, com a mesma mensagem genérica', async () => {
    const resposta = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aluna@exemplo.com', senha: 'senha-errada' }),
    });
    expect(resposta.status).toBe(401);
    const corpo = await resposta.json();
    expect(corpo.message).toBe('Credenciais inválidas.');
  });

  it('recusa GET /me sem token', async () => {
    const resposta = await fetch(`${BASE}/me`);
    expect(resposta.status).toBe(401);
  });
});
