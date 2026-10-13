import Link from 'next/link';
import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormularioLogin } from '@/components/auth/formulario-login';

export const metadata: Metadata = { title: 'Entrar — Tutora Oria' };

export default function PaginaLogin() {
  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
        <CardDescription>Acesse sua conta para continuar a leitura.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <FormularioLogin />
        <p className="text-center text-sm text-muted-foreground">
          Ainda não tem conta?{' '}
          <Link href="/registro" className="text-primary underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
