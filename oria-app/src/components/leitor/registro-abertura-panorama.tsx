'use client';

import { useEffect } from 'react';
import { enfileirarEvento } from '@/lib/telemetria/fila';

export function RegistroAberturaPanorama({ secaoId }: { secaoId: string }) {
  useEffect(() => {
    enfileirarEvento('abriu_panorama', secaoId);
  }, [secaoId]);

  return null;
}
