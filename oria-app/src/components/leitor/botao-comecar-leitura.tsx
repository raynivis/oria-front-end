'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { marcarPanoramaVisto } from '@/lib/leitor/panorama-visto';

export function BotaoComecarLeitura({ secaoId }: { secaoId: string }) {
  const router = useRouter();

  function comecar() {
    marcarPanoramaVisto(secaoId);
    router.push(`/ler/${secaoId}`);
  }

  return <Button onClick={comecar}>Começar a leitura</Button>;
}
