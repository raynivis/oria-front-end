'use client';

import { useEffect, useState } from 'react';
import { PainelChat } from './painel';

/**
 * Só monta o painel fixo (≥1024px). Abaixo disso o chat vive na gaveta de
 * `BarraMobile` — as duas instâncias nunca ficam montadas ao mesmo tempo,
 * senão uma pergunta disparada por `ProvedorPerguntaTrecho` seria enviada em
 * dobro.
 */
export function PainelChatDesktop(props: { sessaoId: string; secaoId: string }) {
  const [grande, setGrande] = useState(false);

  useEffect(() => {
    const consulta = window.matchMedia('(min-width: 1024px)');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGrande(consulta.matches);
    const aoMudar = (evento: MediaQueryListEvent) => setGrande(evento.matches);
    consulta.addEventListener('change', aoMudar);
    return () => consulta.removeEventListener('change', aoMudar);
  }, []);

  if (!grande) return null;
  return <PainelChat {...props} />;
}
