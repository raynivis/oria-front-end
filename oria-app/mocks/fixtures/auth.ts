import type { AutenticacaoSaida, UsuarioSaida } from '@/lib/api/tipos';

type UsuarioComSenha = UsuarioSaida & { senha: string };

const usuariosPorEmail = new Map<string, UsuarioComSenha>();
const emailPorToken = new Map<string, string>();
let proximoId = 2;

usuariosPorEmail.set('aluna@exemplo.com', {
  id: 'usuario-1',
  nome: 'Aluna Exemplo',
  email: 'aluna@exemplo.com',
  senha: 'senha1234',
  criadoEm: '2026-01-10T09:00:00.000Z',
});

function paraSaida({ senha, ...saida }: UsuarioComSenha): UsuarioSaida {
  void senha;
  return saida;
}

function emitirToken(email: string): string {
  const token = `token-mock-${email}-${Date.now()}`;
  emailPorToken.set(token, email);
  return token;
}

export type ResultadoRegistro = { tipo: 'sucesso'; dados: AutenticacaoSaida } | { tipo: 'email_em_uso' };

export function registrar(nome: string, email: string, senha: string): ResultadoRegistro {
  if (usuariosPorEmail.has(email)) {
    return { tipo: 'email_em_uso' };
  }
  const usuario: UsuarioComSenha = { id: `usuario-${proximoId++}`, nome, email, senha, criadoEm: new Date().toISOString() };
  usuariosPorEmail.set(email, usuario);
  return { tipo: 'sucesso', dados: { token: emitirToken(email), user: paraSaida(usuario) } };
}

export type ResultadoLogin = { tipo: 'sucesso'; dados: AutenticacaoSaida } | { tipo: 'credenciais_invalidas' };

export function autenticar(email: string, senha: string): ResultadoLogin {
  const usuario = usuariosPorEmail.get(email);
  if (!usuario || usuario.senha !== senha) {
    return { tipo: 'credenciais_invalidas' };
  }
  return { tipo: 'sucesso', dados: { token: emitirToken(email), user: paraSaida(usuario) } };
}

export function buscarUsuarioPorToken(token: string | null | undefined): UsuarioSaida | null {
  const email = token ? emailPorToken.get(token) : undefined;
  const usuario = email ? usuariosPorEmail.get(email) : undefined;
  return usuario ? paraSaida(usuario) : null;
}
