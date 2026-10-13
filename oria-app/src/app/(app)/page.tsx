import Link from 'next/link';
import { redirect } from 'next/navigation';
import { chamarApi } from '@/lib/api/cliente';
import { ErroApiCliente } from '@/lib/api/erros';
import type { UsuarioSaida } from '@/lib/api/tipos';
import { BotaoLogout } from '@/components/auth/botao-logout';

export default async function Home() {
  let usuario: UsuarioSaida;
  try {
    usuario = await chamarApi<UsuarioSaida>('/me');
  } catch (erro) {
    if (erro instanceof ErroApiCliente && erro.statusCode === 401) {
      redirect('/login');
    }
    throw erro;
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4">
      <p className="text-muted-foreground">Olá, {usuario.nome}.</p>
      <Link href="/biblioteca" className="text-primary underline-offset-4 hover:underline">
        Ir para a biblioteca
      </Link>
      <BotaoLogout />
    </main>
  );
}
