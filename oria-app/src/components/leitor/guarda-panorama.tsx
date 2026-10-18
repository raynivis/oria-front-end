'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { panoramaFoiVisto } from '@/lib/leitor/panorama-visto';

/**
 * Redireciona ao panorama na primeira visita à seção; nas seguintes, não faz
 * nada. Sempre renderiza `children` — o servidor não tem como saber se o
 * panorama já foi visto (isso só existe em `localStorage`), então esconder o
 * conteúdo até a confirmação deixaria a tela em branco em *toda* visita, não
 * só na primeira. Numa visita nova de verdade há um flash breve do leitor
 * antes do redirecionamento disparar; é o preço de não ter isso no servidor
 * ainda (ver Fase 4).
 */
export function GuardaPanorama({ secaoId, children }: { secaoId: string; children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    if (!panoramaFoiVisto(secaoId)) {
      router.replace(`/ler/${secaoId}/panorama`);
    }
  }, [secaoId, router]);

  return <>{children}</>;
}
