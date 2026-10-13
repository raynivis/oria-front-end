/**
 * "Primeira visita a uma seção redireciona ao panorama; visitas seguintes
 * não" (UI_RULES.md, seção 1.3) — sem telemetria ainda (Fase 4), guardamos
 * isso em localStorage. Quando `GET /me/progresso` existir de verdade, dá
 * para reconciliar com o servidor; por ora é só cache local, por sessão de
 * navegador, igual ao combinado para "seções abertas".
 */
const chave = (secaoId: string) => `oria:panorama-visto:${secaoId}`;

export function panoramaFoiVisto(secaoId: string): boolean {
  try {
    return window.localStorage.getItem(chave(secaoId)) === '1';
  } catch {
    return false;
  }
}

export function marcarPanoramaVisto(secaoId: string): void {
  try {
    window.localStorage.setItem(chave(secaoId), '1');
  } catch {
    // localStorage pode falhar (modo privado, cota); não é crítico aqui.
  }
}
