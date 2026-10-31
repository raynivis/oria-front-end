import { chamarApi, redirecionarSeSessaoExpirada } from '@/lib/api/cliente';
import type { UsuarioSaida } from '@/lib/api/tipos';
import { BarraLateral } from '@/components/app-shell/barra-lateral';
import { CabecalhoTopo } from '@/components/app-shell/cabecalho-topo';

/** Casca da parte autenticada: sidebar + cabeçalho, presente em toda tela de (app), nenhuma em (auth). */
export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  let usuario: UsuarioSaida;
  try {
    usuario = await chamarApi<UsuarioSaida>('/me');
  } catch (erro) {
    redirecionarSeSessaoExpirada(erro);
    throw erro;
  }

  return (
    <div className="flex min-h-0 flex-1">
      <BarraLateral />
      <div className="flex min-w-0 flex-1 flex-col">
        <CabecalhoTopo usuario={usuario} />
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
