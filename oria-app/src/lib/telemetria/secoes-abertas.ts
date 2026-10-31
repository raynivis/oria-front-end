/**
 * "Seções lidas por seção do sumário" é uma lacuna da API (IMPLEMENTATION.md,
 * "Lacunas da API") — por enquanto reconstruímos no cliente a partir do
 * evento `abriu` que o próprio front envia. É contorno, não solução: some
 * ao trocar de dispositivo, como o próprio documento já avisa.
 */
const CHAVE = 'oria:secoes-abertas';

export function lerSecoesAbertas(): string[] {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as string[]) : [];
  } catch {
    return [];
  }
}

export function marcarSecaoAberta(secaoId: string): void {
  try {
    const atuais = lerSecoesAbertas();
    if (!atuais.includes(secaoId)) {
      window.localStorage.setItem(CHAVE, JSON.stringify([...atuais, secaoId]));
    }
  } catch {
    // localStorage pode falhar (modo privado, cota); não é crítico aqui.
  }
}
