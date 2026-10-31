'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type PerguntaTrecho = { mensagem: string; nonce: number };

type ContextoType = {
  perguntaPendente: PerguntaTrecho | null;
  consumirPergunta: () => void;
  perguntarSobreTrecho: (trechoTexto: string, atalho: string) => void;
};

const Contexto = createContext<ContextoType | null>(null);

/**
 * Ponte entre a seleção de texto (`TextoSecao`) e o chat da tutora
 * (`PainelChat`, que existe em até duas instâncias — aside fixo e gaveta
 * mobile — mas só uma fica montada de cada vez, ver `PainelChatDesktop` e
 * `BarraMobile`): perguntar sobre um trecho selecionado precisa alcançar
 * quem estiver montado sem acoplar os dois lados um ao outro.
 */
export function ProvedorPerguntaTrecho({ children }: { children: ReactNode }) {
  const [perguntaPendente, setPerguntaPendente] = useState<PerguntaTrecho | null>(null);

  const perguntarSobreTrecho = useCallback((trechoTexto: string, atalho: string) => {
    setPerguntaPendente((atual) => ({
      mensagem: `Sobre este trecho:\n"${trechoTexto}"\n\n${atalho}`,
      nonce: (atual?.nonce ?? 0) + 1,
    }));
  }, []);

  const consumirPergunta = useCallback(() => setPerguntaPendente(null), []);

  return (
    <Contexto.Provider value={{ perguntaPendente, consumirPergunta, perguntarSobreTrecho }}>
      {children}
    </Contexto.Provider>
  );
}

export function usePerguntaTrecho() {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('usePerguntaTrecho precisa estar dentro de ProvedorPerguntaTrecho');
  return contexto;
}
