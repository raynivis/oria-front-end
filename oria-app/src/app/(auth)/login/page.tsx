import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormularioLogin } from '@/components/auth/formulario-login';

export const metadata: Metadata = { title: 'Entrar — Tutora Oria' };

type ParametrosPagina = { searchParams: Promise<{ sessao?: string }> };

export default async function PaginaLogin({ searchParams }: ParametrosPagina) {
  const { sessao } = await searchParams;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta para continuar a leitura.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {sessao === 'expirada' && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
            Sua sessão expirou. Faça login novamente.
          </p>
        )}
        <FormularioLogin />
        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link href="/registro" className="font-medium text-primary hover:underline">
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
