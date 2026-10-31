import type { SecaoSaida } from '@/lib/api/tipos';
import { livroMenteEDecisao } from './livros';

type SecaoOrdenada = Pick<SecaoSaida, 'id' | 'titulo' | 'textoCompleto'>;

const SECOES_EM_ORDEM: SecaoOrdenada[] = [
  {
    id: 'sec-1-1',
    titulo: 'Sistema 1 e Sistema 2',
    textoCompleto:
      'Kahneman descreve dois modos de pensamento que operam o tempo todo em nossa cognição. O Sistema 1 é rápido, automático e opera com pouco esforço; reconhece padrões, associa ideias e reage antes que possamos deliberar. O Sistema 2 é lento, deliberado e exige atenção; é ele que verifica, calcula e corrige.\n\nO Sistema 1 é especialista em substituir uma pergunta difícil por outra mais fácil, sem que percebamos a troca. Esse mecanismo economiza esforço cognitivo, mas também é a origem de boa parte dos vieses de julgamento que este livro examina.',
  },
  {
    id: 'sec-1-2',
    titulo: 'O Papel da Intuição',
    textoCompleto:
      'Intuições não são adivinhações aleatórias: são o produto de um reconhecimento de padrões acumulado pela experiência. Um enxadrista experiente "vê" o próximo lance sem calcular cada variação, porque o Sistema 1 já reconheceu a posição.\n\nO problema surge quando a intuição opera fora do domínio em que foi treinada. Nesses casos, a confiança subjetiva permanece alta mesmo quando a precisão despenca — e é exatamente aí que a leitura crítica precisa desacelerar o julgamento.',
  },
  {
    id: 'sec-2-1',
    titulo: 'O que Conta como Prova',
    textoCompleto:
      'Nem toda afirmação que parece plausível é sustentada por evidência. Uma prova, no sentido que interessa à leitura acadêmica, é um dado verificável que outra pessoa poderia examinar de forma independente e chegar à mesma conclusão.\n\nDistinguir opinião de evidência é a primeira habilidade que este capítulo pretende desenvolver. Sem ela, qualquer heurística de julgamento erra com a mesma convicção de quando acerta.',
  },
  {
    id: 'sec-2-2',
    titulo: 'Vieses de Confirmação',
    textoCompleto:
      'Buscamos, por padrão, informações que confirmem o que já acreditamos, e damos menos peso ao que contradiz nossas hipóteses iniciais. Esse viés não é um defeito de caráter: é um atalho estrutural do Sistema 1.\n\nCombater o viés de confirmação exige um hábito deliberado — procurar ativamente o argumento que derrubaria a própria conclusão antes de aceitá-la como definitiva.',
  },
  {
    id: 'sec-3-1',
    titulo: 'Heurísticas e Vieses',
    textoCompleto:
      'Uma heurística é um atalho mental que troca um cálculo complexo por uma estimativa rápida. Na maioria das situações cotidianas, funciona bem o suficiente — é por isso que sobrevive.\n\nQuando confrontamos uma questão difícil, mas sem resposta imediata, muitas vezes respondemos a uma questão mais fácil sem notar a substituição. O resultado parece uma resposta à pergunta original, mas na verdade resolve outra coisa.',
  },
  {
    id: 'sec-3-2',
    titulo: 'Substituição de Perguntas',
    textoCompleto:
      "A substituição de perguntas é o mecanismo central por trás de heurísticas como disponibilidade e ancoragem. Perguntado 'qual é a probabilidade deste evento', o Sistema 1 frequentemente responde 'quão facilmente me vêm exemplos deste evento à mente' — e trata as duas respostas como se fossem a mesma.\n\nReconhecer a troca é o primeiro passo para corrigi-la. O segundo é aceitar que a correção exige o Sistema 2, que é lento e cansa — por isso tão raramente é acionado sem disciplina.",
  },
];

export const secoesFixture: Record<string, SecaoSaida> = Object.fromEntries(
  SECOES_EM_ORDEM.map((secao, indice) => {
    const anteriorRef = SECOES_EM_ORDEM[indice - 1];
    const proximaRef = SECOES_EM_ORDEM[indice + 1];

    const saida: SecaoSaida = {
      id: secao.id,
      titulo: secao.titulo,
      textoCompleto: secao.textoCompleto,
      livro: { id: livroMenteEDecisao.id, titulo: livroMenteEDecisao.titulo },
      anterior: anteriorRef ? { id: anteriorRef.id, titulo: anteriorRef.titulo } : null,
      proxima: proximaRef ? { id: proximaRef.id, titulo: proximaRef.titulo } : null,
    };

    return [secao.id, saida];
  }),
);
