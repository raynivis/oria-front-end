import { z } from 'zod';

/** Espelha as validações do backend (BACKEND_INTEGRATION.md, seção 2.1). */

export const esquemaLogin = z.object({
  email: z.email('Informe um e-mail válido.'),
  senha: z.string().min(1, 'Informe sua senha.'),
});

export const esquemaRegistro = z.object({
  nome: z.string().min(1, 'Informe seu nome.'),
  email: z.email('Informe um e-mail válido.'),
  senha: z.string().min(8, 'A senha precisa ter pelo menos 8 caracteres.'),
});

export type DadosLogin = z.infer<typeof esquemaLogin>;
export type DadosRegistro = z.infer<typeof esquemaRegistro>;
