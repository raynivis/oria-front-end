/**
 * Store mínima de toasts, sem biblioteca nova: um pub-sub simples que
 * `ToastViewport` (montado uma vez no layout raiz) consome. Usada pelo
 * aviso de fichamento assíncrono pronto (item 2.5) e por qualquer outro
 * aviso curto e não-bloqueante.
 */
export type VarianteToast = 'sucesso' | 'erro' | 'info';

export type Toast = { id: number; mensagem: string; variante: VarianteToast };

type Ouvinte = (toasts: Toast[]) => void;

let proximoId = 1;
let toasts: Toast[] = [];
const ouvintes = new Set<Ouvinte>();

function notificar() {
  for (const ouvinte of ouvintes) ouvinte(toasts);
}

export function inscrever(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  ouvinte(toasts);
  return () => ouvintes.delete(ouvinte);
}

export function emitirToast(mensagem: string, variante: VarianteToast = 'info', duracaoMs = 5000): void {
  const id = proximoId++;
  toasts = [...toasts, { id, mensagem, variante }];
  notificar();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    notificar();
  }, duracaoMs);
}

export function removerToast(id: number): void {
  toasts = toasts.filter((t) => t.id !== id);
  notificar();
}
