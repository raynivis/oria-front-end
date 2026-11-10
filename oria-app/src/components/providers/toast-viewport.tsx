'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { inscrever, removerToast, type Toast } from '@/lib/toast/store';

const ICONE = { sucesso: CheckCircle2, erro: AlertTriangle, info: Info } as const;
const COR = {
  sucesso: 'border-l-2 border-emerald-500 bg-emerald-100 text-emerald-900 dark:bg-emerald-500/20 dark:text-emerald-200',
  erro: 'border-l-2 border-destructive bg-destructive/10 text-destructive',
  info: 'border-l-2 border-primary bg-primary/10 text-foreground',
} as const;

export function ToastViewport() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => inscrever(setToasts), []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((toast) => {
        const Icone = ICONE[toast.variante];
        return (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex max-w-sm items-start gap-2 rounded-lg px-3 py-2 text-sm shadow-elevated ${COR[toast.variante]}`}
          >
            <Icone className="mt-0.5 size-4 shrink-0" />
            <p className="flex-1">{toast.mensagem}</p>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => removerToast(toast.id)}
              className="shrink-0 opacity-70 hover:opacity-100"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
