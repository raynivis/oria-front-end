'use client';

import type { ReactNode } from 'react';
import { ListTree, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

/**
 * Abaixo de 1024px o painel da tutora vira gaveta; abaixo de 768px o
 * sumário também vira menu (UI_RULES.md, seção 1.2). Esta barra só existe
 * nessas larguras — nas maiores, sumário e tutora já são colunas fixas.
 */
export function BarraMobile({ sumario, tutora }: { sumario: ReactNode; tutora: ReactNode }) {
  return (
    <div className="flex items-center gap-2 border-b border-border p-2 lg:hidden">
      <Sheet>
        <SheetTrigger render={<Button variant="outline" size="sm" className="md:hidden" />}>
          <ListTree className="size-4" />
          Sumário
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Sumário</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto px-4 pb-4">{sumario}</div>
        </SheetContent>
      </Sheet>

      <Sheet>
        <SheetTrigger render={<Button variant="outline" size="sm" className="ml-auto" />}>
          <MessageCircle className="size-4" />
          Tutora
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Tutora</SheetTitle>
          </SheetHeader>
          <div className="px-4 pb-4">{tutora}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
