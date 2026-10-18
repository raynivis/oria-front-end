'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { cn } from 'cn';
import { LINKS_NAV } from '@/lib/app-shell/links';

/** Sidebar fixa — a assinatura visual do protótipo BookMind AI. Some abaixo de `md`; ver MenuMobile. */
export function BarraLateral() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex items-center gap-2.5 border-b border-sidebar-border px-5 py-5">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-hero text-gradient-hero-surface">
          <BookOpen className="size-5" />
        </div>
        <div>
          <p className="font-semibold tracking-tight text-sidebar-foreground">Tutora Oria</p>
          <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">Tutor de leitura</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {LINKS_NAV.map((link) => {
          const Icon = link.icon;
          const ativo = link.exato ? pathname === link.href : pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={ativo ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                ativo
                  ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/60',
              )}
            >
              <Icon className="size-4" />
              {link.rotulo}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
