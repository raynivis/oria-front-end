import { CheckCircle2, FilePenLine, Pencil } from 'lucide-react';
import { cn } from 'cn';
import { chamarApi, redirecionarSeSessaoExpirada } from '@/lib/api/cliente';
import type { ProgressoSaida, UsuarioSaida } from '@/lib/api/tipos';
import { BotaoContinuarLeitura } from '@/components/dashboard/botao-continuar-leitura';

// Classes completas e estáticas — o Tailwind não detecta nomes montados em runtime (`from-${tom}`).
const TONS = {
  'chart-1': 'bg-gradient-to-br from-chart-1/15 to-chart-1/5 text-chart-1',
  'chart-2': 'bg-gradient-to-br from-chart-2/15 to-chart-2/5 text-chart-2',
  'chart-4': 'bg-gradient-to-br from-chart-4/15 to-chart-4/5 text-chart-4',
} as const;

async function buscarDados(): Promise<{ usuario: UsuarioSaida; progresso: ProgressoSaida }> {
  try {
    const [usuario, progresso] = await Promise.all([
      chamarApi<UsuarioSaida>('/me'),
      chamarApi<ProgressoSaida>('/me/progresso'),
    ]);
    return { usuario, progresso };
  } catch (erro) {
    // Next renderiza layout e página em paralelo — o /me do layout não termina
    // necessariamente antes deste, então esta página também precisa tratar o 401.
    redirecionarSeSessaoExpirada(erro);
    throw erro;
  }
}

export default async function Home() {
  const { usuario, progresso } = await buscarDados();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-hero p-6 text-gradient-hero-surface shadow-elevated md:p-8">
        <div
          aria-hidden
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, var(--gradient-hero-surface) 1px, transparent 1px), radial-gradient(circle at 80% 60%, var(--gradient-hero-surface) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Olá, {usuario.nome}</h1>
            <p className="mt-1 opacity-90">Retome a leitura e elabore o que compreendeu.</p>
          </div>
          <BotaoContinuarLeitura destaque />
        </div>
      </div>

      {/*
        Só os três números que GET /me/progresso realmente fornece — nada
        calculado no cliente a partir de dado parcial (IMPLEMENTATION.md,
        Fase 9). Sem questões respondidas, média de dicas, progresso semanal
        ou gráfico: a API não fornece esses dados.
      */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CardMetrica icon={CheckCircle2} tom="chart-1" rotulo="Seções abertas" valor={progresso.secoesAbertas} />
        <CardMetrica icon={FilePenLine} tom="chart-2" rotulo="Fichamentos criados" valor={progresso.fichamentos.total} />
        <CardMetrica
          icon={Pencil}
          tom="chart-4"
          rotulo="Editados por você"
          valor={progresso.fichamentos.comEdicaoDoAluno}
        />
      </div>
    </main>
  );
}

function CardMetrica({
  icon: Icon,
  tom,
  rotulo,
  valor,
}: {
  icon: typeof CheckCircle2;
  tom: keyof typeof TONS;
  rotulo: string;
  valor: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className={cn('mb-3 grid size-10 place-items-center rounded-xl', TONS[tom])}>
        <Icon className="size-5" />
      </div>
      <p className="text-2xl font-bold">{valor}</p>
      <p className="text-sm font-medium text-muted-foreground">{rotulo}</p>
    </div>
  );
}
