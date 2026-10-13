# Tutora Oria — o que a validação exige do frontend

A metodologia do TCC é Design Science Research, com avaliação **formativa e
artificial** pelo quadro FEDS: sem participantes, conduzida pelos pesquisadores
sobre o artefato.

Três procedimentos. O frontend tem papel diferente em cada um:

| | O que é | Papel do front |
|---|---|---|
| **A** | Comparação técnica das saídas, com e sem a Oria | Nenhum: é script do backend |
| **B** | Inspeção heurística da interface | **É o objeto avaliado** |
| **C** | Demonstração por cenários | **É o meio da demonstração** |

Este documento trata de B e C. O documento equivalente do backend cobre A.

---

## 1. Avaliação B — a interface é o objeto

Autor e orientador inspecionam a interface separadamente, pelas dez heurísticas
de Nielsen, e consolidam uma lista única de problemas com severidade de 0 a 4.
**Problemas de severidade 3 ou 4 precisam ser corrigidos antes da defesa.**

Isso tem uma consequência de cronograma: reserve tempo depois da inspeção para
corrigir. Inspeção feita na véspera da entrega não serve para nada, porque não
sobra tempo de agir sobre o resultado.

### 1.1 As duas heurísticas que mais importam aqui

Para interface com IA generativa, duas das dez concentram o risco.

**Heurística 1 — visibilidade do estado do sistema.** O aluno sabe quando a Oria
está gerando? Sabe de onde veio a resposta? Toda tela que chama LLM precisa de
estado de carregamento explícito, e toda resposta precisa de origem visível.

Telas afetadas: panorama (primeira geração demora segundos), fichamento, chat
(stream), questões (geração do conjunto e de cada passo).

**Heurística 9 — reconhecer, diagnosticar e recuperar de erros.** O que acontece
quando a API falha ou demora? O evento `erro` do stream, o 400 de pedir resolução
cedo, o 401 de sessão expirada, o timeout de uma geração — cada um precisa de
mensagem compreensível e de caminho de saída.

### 1.2 Checklist antes da inspeção

A inspeção encontra problemas reais, não lacunas óbvias de implementação. Antes
de marcá-la, garanta que existe em **toda** tela:

- [ ] estado de carregamento, com indicação do que está acontecendo ("gerando
      panorama", não um spinner mudo);
- [ ] estado de erro, com mensagem em português e ação de repetir;
- [ ] estado vazio, quando a lista não tem itens;
- [ ] foco visível no teclado, em todo elemento interativo;
- [ ] rótulo em todo campo de formulário;
- [ ] título de página distinto, para orientação.

Seis itens que, se ausentes, geram dezenas de problemas triviais na lista e
escondem os problemas que interessam.

### 1.3 Pontos de atenção por heurística

Mapeamento das dez para esta interface. Serve de roteiro na segunda passada.

| Heurística | Onde olhar com atenção |
|---|---|
| 1. Visibilidade do estado | Geração de LLM, stream em andamento, salvamento do fichamento |
| 2. Correspondência com o mundo real | Vocabulário: "fichamento", "panorama", "passo" fazem sentido ao aluno? |
| 3. Controle e liberdade | Cancelar uma geração, sair do fluxo de questões, desfazer edição |
| 4. Consistência | Mesmo padrão de botão, de card e de mensagem de erro entre telas |
| 5. Prevenção de erros | Sair do fichamento com alterações não salvas; desistir da questão |
| 6. Reconhecer em vez de lembrar | O aluno vê em que seção está e quais conceitos já revisou? |
| 7. Flexibilidade | Atalhos de teclado no leitor; tamanho de fonte |
| 8. Estética e minimalismo | A coluna de 68ch e o painel lateral competem por atenção? |
| 9. Recuperação de erros | Falha do stream, 400 do fluxo de passos, sessão expirada |
| 10. Ajuda e documentação | O aluno entende por que a tutora não entrega a resposta? |

A heurística 10 merece destaque. O fluxo step-based é deliberadamente
frustrante — o sistema recusa dar a resposta de propósito. Sem explicação, o
aluno interpreta como defeito. Vale um texto curto na primeira vez que ele
entra no fluxo.

### 1.4 Limite a declarar

Nielsen e Molich mostram que um avaliador sozinho encontra uma fração pequena dos
problemas. Aqui são dois, e um deles é quem desenvolveu. A inspeção identifica
problemas; não esgota a usabilidade. Isso já está nas limitações do Capítulo 3.

---

## 2. Avaliação C — a interface é o meio

Quatro cenários executados ponta a ponta, documentados com captura de tela,
resultado esperado, resultado obtido, requisito atendido, tempo de resposta e
tokens.

O documento `SCENARIOS.md` do backend tem o roteiro completo, passo a passo, com
o endpoint de cada ação. O que segue é o que a interface precisa suportar.

### 2.1 Capturas que são evidência, não ilustração

Cinco telas têm valor probatório no Capítulo 4. Elas precisam estar visualmente
corretas antes da execução dos cenários:

**A recusa da tutora.** Cenário 1, passo 10. É a evidência visual do guardrail de
restrição ao material. Precisa ser inconfundivelmente diferente de uma resposta
normal.

**A marcação de origem no fichamento.** Cenário 2, passo 5. Materializa a lacuna
2 do Capítulo 2. A diferença entre o texto da IA e o do aluno precisa aparecer na
captura sem necessidade de legenda explicativa.

**A tela de resposta certa e a de resposta errada, no fluxo de questões.**
Cenário 3, passos 2 e 4. São **duas capturas que precisam ser idênticas** exceto
pelo texto digitado. É a demonstração visual do step-based, e é o que a banca vai
procurar.

**A ausência do botão de resolução.** Cenário 3, passo 7. Captura própria,
mostrando que no passo 2 o botão não existe.

**O confronto de metacognição.** Cenário 4, passo 5. Operacionalização da
compreensão ilusória de Flavell.

### 2.2 Estado do sistema antes de executar

Os cenários dependem de estado acumulado:

- o passo 9 do Cenário 1 liga a um capítulo anterior, então leia duas seções
  antes;
- o Cenário 4 confronta com os passos consumidos no Cenário 3, então execute os
  quatro na ordem, na mesma conta;
- declare confiança alta de propósito no Cenário 4, senão o sistema não sinaliza
  e o passo não demonstra nada.

### 2.3 Tempo de resposta e tokens

Cada passo que envolve LLM registra tempo e tokens. Esses dados vêm de
`GET /admin/metricas/ultimas-chamadas`, que exige `x-admin-api-key` e **não deve
ser chamada pelo app do aluno**.

Durante a execução dos cenários, consulte essa rota por fora — Postman, curl ou
uma página de operação separada do app. Não embuta a chave no frontend.

### 2.4 Modo de captura

Considere acrescentar um modo que facilite as capturas: desabilitar animações,
fixar o tamanho da janela, ocultar dados de teste irrelevantes. Uma variável
`NEXT_PUBLIC_MODO_CAPTURA=1` que aplique `prefers-reduced-motion` e uma largura
fixa poupa retrabalho quando uma captura sair ruim.

---

## 3. Rastreabilidade

A matriz requisito por cenário é responsabilidade compartilhada. O backend define
os 24 requisitos funcionais em `SCENARIOS.md`; o front precisa garantir que cada
um tenha tela correspondente.

Requisito sem tela aparece como **não demonstrado**, e isso chama atenção na
banca. Ao final da Fase 9, confira a lista inteira contra as telas construídas.

---

## 4. O que o frontend não precisa fazer

O protocolo com participantes é trabalho futuro no TCC. Não construa:

- coleta de consentimento ou TCLE;
- aplicação de SUS, escala de Paas ou teste de compreensão;
- designação de participantes a grupos.

A telemetria da Fase 4 já cobre a parte instrumental, caso o experimento aconteça
depois.

Também não construa nada para a Avaliação A: as 60 saídas são geradas por script
do backend, sem passar pela interface.
