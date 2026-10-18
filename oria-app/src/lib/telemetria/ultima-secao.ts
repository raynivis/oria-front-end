/**
 * "Última seção lida" é uma lacuna da API (IMPLEMENTATION.md, "Lacunas da
 * API") — contornada no cliente a partir do evento `abriu` que o próprio
 * front já envia. Contorno, não solução: some ao trocar de dispositivo.
 */
const CHAVE = 'oria:ultima-secao';

export function marcarUltimaSecao(secaoId: string): void {
  try {
    window.localStorage.setItem(CHAVE, secaoId);
  } catch {
    // localStorage pode falhar (modo privado, cota); não é crítico aqui.
  }
}

export function lerUltimaSecao(): string | null {
  try {
    return window.localStorage.getItem(CHAVE);
  } catch {
    return null;
  }
}
