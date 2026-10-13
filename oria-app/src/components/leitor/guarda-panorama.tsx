'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { panoramaFoiVisto } from '@/lib/leitor/panorama-visto';

/** Redireciona ao panorama na primeira visita à seção; nas seguintes, renderiza o leitor. */
export function GuardaPanorama({ secaoId, children }: { secaoId: string; children: React.ReactNode }) {
  const router = useRouter();
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    // localStorage não existe no servidor: só dá para saber depois de montar.
    if (panoramaFoiVisto(secaoId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPronto(true);
    } else {
      router.replace(`/ler/${secaoId}/panorama`);
    }
  }, [secaoId, router]);

  if (!pronto) return null;
  return <>{children}</>;
}
