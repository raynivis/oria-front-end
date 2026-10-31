# Frontend da Tutora Oria — pacote de implementação

Cinco arquivos para começar a implementar com o Claude Code.

| Arquivo | O que é |
|---|---|
| `CLAUDE.md` | Contexto permanente. O Claude Code lê automaticamente. Contém as seis regras invioláveis de interface. |
| `UI_RULES.md` | As decisões de tela e sua fundamentação pedagógica, com os trechos de código que não admitem improviso. |
| `IMPLEMENTATION.md` | Dez fases, com rotas, componentes e critérios de aceite. |
| `VALIDATION.md` | O que a validação do TCC exige da interface: inspeção heurística e capturas dos cenários. |
| `BACKEND_INTEGRATION.md` | Contrato da API. **Gerado pelo time do backend — é a fonte da verdade.** Não editar aqui. |

## Como começar

```bash
npx create-next-app@latest oria-web --typescript --tailwind --app --eslint
cd oria-web
cp ../CLAUDE.md ../UI_RULES.md ../IMPLEMENTATION.md ../VALIDATION.md .
cp ../BACKEND_INTEGRATION.md .
```

Abra o Claude Code na raiz do projeto. Ele lê o `CLAUDE.md` sozinho. Depois:

```
Leia IMPLEMENTATION.md e UI_RULES.md e execute a Fase 0. Antes de escrever
código, me mostre o plano de arquivos que você vai criar.
```

Uma fase por sessão. Ao final de cada uma, rode `npm run lint && npm run test` e
faça commit antes de seguir.

A API roda na 3000, então o front roda na 3001:

```bash
npm run dev -- -p 3001
```

## O que ainda não existe, e por que não bloqueia

**O ebook.** Não bloqueia nada, e aqui bloqueia menos do que no backend. A API
não entrega o arquivo EPUB: entrega `textoCompleto` por seção, já extraído. O
front renderiza texto. Um fixture de MSW com dois ou três parágrafos de lorem
basta para construir o leitor inteiro, e trocar pelo conteúdo real depois não
muda uma linha de componente.

**O backend rodando.** A estratégia está na primeira seção do
`IMPLEMENTATION.md`: MSW com fixtures derivados dos tipos de
`BACKEND_INTEGRATION.md`. Construa as dez fases contra os mocks e ligue na API
quando ela subir. O ganho não é só de cronograma — fixtures explícitos forçam a
decidir o que a tela faz quando o campo vem `null`, que é exatamente onde a regra
6 se quebra.

## A decisão que mudou o projeto do front

O planejamento anterior previa `epubjs` ou `react-reader`, e chamava o leitor de
componente de maior risco técnico. **Isso saiu.** A API serve
`textoCompleto: string` por seção, então o leitor é uma coluna de texto com
tipografia cuidada, não um renderizador de EPUB. Desaparecem a resolução de CFI,
a paginação virtual e a sincronização de posição.

O que sobra dessa troca é um problema menor: o salto para uma citação do chat
passa a ser por correspondência de texto dentro do `textoCompleto`, não por CFI.
O procedimento está em `UI_RULES.md`, seção 2.3, com a regra de que não achar o
trecho não pode quebrar a tela.

## Lacunas da API

Seis dados que o planejamento previa e que a API hoje não expõe — última seção
lida, seções lidas por livro e por seção, questões respondidas, média de passos,
progresso semanal. A tabela está em `IMPLEMENTATION.md`.

As três primeiras têm contorno no cliente. As três últimas não: ou o backend
expõe, ou saem do dashboard. **Omitir é correto; estimar não é.** É a regra 6 do
`CLAUDE.md`, e é a que mais tenta ser contornada quando um card fica visualmente
vazio.

Há quatro perguntas ao backend registradas ao final do `IMPLEMENTATION.md`.
As duas primeiras — formato do `textoCompleto` e se o `trecho` da citação é
literal — precisam de resposta antes da Fase 3.

## A regra que mais se quebra sem perceber

A primeira do `CLAUDE.md`: a ausência de veredito no fluxo de questões. A API não
devolve `correto`, e a interface não pode suprir isso.

Quebra-se por descuido estético, não por decisão: um ícone de alerta no retorno
da dica, uma borda âmbar, um "vamos tentar de novo" no lugar de um texto neutro,
um `toast` de erro quando a tentativa não convence. Qualquer um desses entrega ao
aluno a informação que o *step-based* existe para retardar, e contradiz a seção
2.2 do TCC.

A defesa é o teste e2e do critério de aceite da Fase 7: duas tentativas, uma
certa e uma errada, produzindo DOM idêntico exceto pelo texto digitado. Peça esse
teste explicitamente — ele é a única coisa que impede a regressão, porque a
violação é invisível até alguém comparar as duas telas lado a lado.

## Antes da defesa

`VALIDATION.md` tem o checklist de seis itens que precisa estar pronto em toda
tela antes da inspeção heurística, e a lista das cinco capturas que têm valor
probatório no Capítulo 4. Vale ler essa parte no começo, não no fim: duas das
capturas dependem de decisões de layout que custam caro para refazer depois.
