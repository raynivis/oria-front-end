'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { esquemaLogin, type DadosLogin } from '@/lib/auth/esquemas';
import { mensagemDeErro, type ErroApi } from '@/lib/api/erros';

export function FormularioLogin() {
  const router = useRouter();
  const [erroServidor, setErroServidor] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<DadosLogin>({ resolver: zodResolver(esquemaLogin) });

  async function enviar(dados: DadosLogin) {
    setErroServidor(null);
    const resposta = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    if (!resposta.ok) {
      const erro = (await resposta.json()) as ErroApi;
      setErroServidor(mensagemDeErro(erro));
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(enviar)} noValidate>
      <FieldGroup>
        {erroServidor && (
          <Alert variant="destructive">
            <AlertDescription>{erroServidor}</AlertDescription>
          </Alert>
        )}

        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input id="email" type="email" autoComplete="email" {...register('email')} />
          <FieldError errors={[errors.email]} />
        </Field>

        <Field data-invalid={!!errors.senha}>
          <FieldLabel htmlFor="senha">Senha</FieldLabel>
          <Input id="senha" type="password" autoComplete="current-password" {...register('senha')} />
          <FieldError errors={[errors.senha]} />
        </Field>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </FieldGroup>
    </form>
  );
}
