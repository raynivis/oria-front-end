/**
 * A API não tem endpoint para buscar a tentativa em andamento de uma
 * questão — só `GET /tentativas/:id`. Para sobreviver a um recarregamento
 * no meio do fluxo (IMPLEMENTATION.md, Fase 7, critério 5), guardamos o id
 * da tentativa e a resposta inicial do aluno (que a API também não devolve
 * de volta) em localStorage, por questão.
 */
type TentativaLocal = { tentativaId: string; respostaInicial: string };

const CHAVE = 'oria:tentativa-por-questao';

function lerMapa(): Record<string, TentativaLocal> {
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    return bruto ? (JSON.parse(bruto) as Record<string, TentativaLocal>) : {};
  } catch {
    return {};
  }
}

export function obterTentativaLocal(questaoId: string): TentativaLocal | null {
  return lerMapa()[questaoId] ?? null;
}

export function salvarTentativaLocal(questaoId: string, tentativaLocal: TentativaLocal): void {
  try {
    const mapa = lerMapa();
    mapa[questaoId] = tentativaLocal;
    window.localStorage.setItem(CHAVE, JSON.stringify(mapa));
  } catch {
    // localStorage pode falhar (modo privado, cota); não é crítico aqui.
  }
}
