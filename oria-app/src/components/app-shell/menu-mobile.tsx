'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { LINKS_NAV } from '@/lib/app-shell/links';

/** Abaixo de `md`, a sidebar vira este menu em gaveta. */
export function MenuMobile() {
  const pathname = usePathname();

  return (
    <Sheet>
      <SheetTrigger render={<Button type="button" variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menu" />}>
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Tutora Oria</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4 pb-4">
          {LINKS_NAV.map((link) => {
            const Icon = link.icon;
            const ativo = link.exato ? pathname === link.href : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={ativo ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm',
                  ativo ? 'bg-accent font-medium text-accent-foreground' : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <Icon className="size-4" />
                {link.rotulo}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
