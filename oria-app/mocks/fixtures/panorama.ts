import type { PanoramaSaida } from '@/lib/api/tipos';

const panoramaPadrao: PanoramaSaida = {
  niveis: [
    {
      rotulo: 'Ideia mais geral',
      titulo: 'Julgamento sob incerteza',
      texto: 'Diante de perguntas difíceis, a mente tende a buscar atalhos em vez de calcular a resposta exata.',
    },
    {
      rotulo: 'Mecanismo central',
      titulo: 'Substituição de perguntas',
      texto:
        'Quando a pergunta original é difícil, o Sistema 1 frequentemente a substitui por uma pergunta mais fácil e responde a ela sem avisar.',
    },
    {
      rotulo: 'Consequência',
      titulo: 'Vieses sistemáticos',
      texto:
        'A substituição produz respostas consistentes, mas sistematicamente deslocadas da resposta correta — não é ruído aleatório, é viés.',
    },
    {
      rotulo: 'Casos específicos',
      titulo: 'Disponibilidade e ancoragem',
      texto:
        'Dois exemplos centrais: estimar risco pela facilidade de lembrar exemplos, e deixar uma primeira informação ancorar as estimativas seguintes.',
    },
  ],
  tempoEstimadoMin: 18,
};

/** Mesmo panorama para qualquer seção nos mocks — o conteúdo real varia por seção na API. */
export function panoramaFixturePara(secaoId: string): PanoramaSaida {
  void secaoId;
  return panoramaPadrao;
}
