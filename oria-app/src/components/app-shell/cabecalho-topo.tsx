import { MenuMobile } from './menu-mobile';
import { ThemeToggle } from '@/components/theme-toggle';
import { BotaoLogout } from '@/components/auth/botao-logout';
import type { UsuarioSaida } from '@/lib/api/tipos';

function iniciais(nome: string): string {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('');
}

export function CabecalhoTopo({ usuario }: { usuario: UsuarioSaida }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
      <MenuMobile />
      <p className="font-semibold md:hidden">Tutora Oria</p>

      <div className="ml-auto flex items-center gap-3">
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <div
            aria-hidden
            className="grid size-9 place-items-center rounded-full bg-hero text-sm font-semibold text-gradient-hero-surface"
          >
            {iniciais(usuario.nome)}
          </div>
          <p className="hidden text-sm font-medium sm:block">{usuario.nome}</p>
        </div>
        <BotaoLogout />
      </div>
    </header>
  );
}
