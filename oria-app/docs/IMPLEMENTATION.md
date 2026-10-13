# Tutora Oria — plano de implementação do frontend

Dez fases com escopo fechado e critério de aceite verificável. Leia `CLAUDE.md` e
`UI_RULES.md` antes de começar; as seis regras do primeiro e as decisões do
segundo valem para todas as fases.

O contrato da API está em `BACKEND_INTEGRATION.md`, mantido pelo time do backend.
Quando algo divergir, o código do backend é a fonte da verdade.

---

## Antes de tudo: desenvolver sem backend e sem ebook

O acervo ainda não existe, e o backend pode não estar no ar em todo momento. Nada
disso bloqueia o front, desde que a primeira fase monte a camada de mocks.

**MSW com fixtures que espelham os tipos da API.** Crie
`mocks/fixtures/` com um livro de três capítulos e duas subseções cada, texto
curto e previsível, mais as respostas de panorama, fichamento, questões,
tentativas e conceitos. Os tipos vêm de `BACKEND_INTEGRATION.md`.

Dois modos:

```bash
npm run dev -- -p 3001     # contra a API real
npm run msw:dev            # contra os mocks, sem backend
```

Isso resolve três problemas de uma vez: desenvolvimento sem dependência externa,
testes determinísticos e a possibilidade de demonstrar a interface antes de o
acervo definitivo existir.

**Um fixture precisa de atenção especial:** o de tentativa, que alimenta o fluxo
step-based. Monte os quatro estados possíveis como fixtures distintos, para
conseguir testar cada tela sem percorrer o fluxo inteiro.

**O stream do chat também precisa de mock.** MSW suporta resposta em stream; monte
um handler que emite alguns eventos `token`, depois dois `citacao`, depois `fim`.
Faça também um fixture de recusa (`encontrouBase: false`) e um de `erro`.

---

## Fase 0 — Fundação

**Objetivo.** Projeto no ar, com tema, mocks e cliente de API. Nenhuma tela de
produto.

Tarefas:

1. `npx create-next-app@latest` com TypeScript, Tailwind, App Router, `src/`.
2. `tsconfig.json` com `strict: true`.
3. shadcn/ui inicializado.
4. **Tokens de design extraídos do protótipo** (cores, raios, tipografia,
   espaçamento) em `globals.css` e `tailwind.config.ts`. Toda cor como token
   semântico, nenhuma literal.
5. `next-themes` com `attribute="class"` e alternador no layout.
6. MSW configurado, com os fixtures descritos acima e o script `msw:dev`.
7. `lib/api/tipos.ts` — todos os tipos copiados de `BACKEND_INTEGRATION.md`.
8. `lib/api/erros.ts` — parser que trata `message` string ou array.
9. `lib/api/cliente.ts` — wrapper de `fetch` que lê o cookie, monta o header,
   normaliza erro e lança `ErroApi` tipado.
10. TanStack Query com provider no layout raiz.

```ts
// lib/api/erros.ts
export type ErroApi = { message: string | string[]; statusCode: number; error?: string };

export function mensagemDeErro(corpo: ErroApi): string {
  return Array.isArray(corpo.message) ? corpo.message.join(' ') : corpo.message;
}
```

**Aceite.** `npm run dev -- -p 3001` sobe sem erro. Alternar tema não produz flash
na hidratação. `npm run msw:dev` responde a `GET /livros` com o fixture. Nenhuma
cor literal no código (verifique com busca por `#` em arquivos de componente).

---

## Fase 1 — Autenticação

**Objetivo.** Login, registro e sessão em cookie `httpOnly`, com todas as
chamadas saindo do servidor.

Rotas:

```
app/(auth)/login/page.tsx
app/(auth)/registro/page.tsx
app/api/auth/login/route.ts      proxy + seta cookie
app/api/auth/registro/route.ts   idem
app/api/auth/logout/route.ts     limpa o cookie
middleware.ts                    protege as rotas de (app)
```

O Route Handler de login está pronto em `BACKEND_INTEGRATION.md`, seção 2.2.
Copie e ajuste. Pontos que ele resolve: CORS, armazenamento do token e o fato de
o backend não setar cookie.

`middleware.ts` verifica a presença do cookie e redireciona ao login. Não valide
o JWT no middleware: o backend valida, e 401 em qualquer chamada dispara o mesmo
redirecionamento.

Validação dos formulários com Zod, espelhando as regras do backend: senha mínima
de 8 no registro, 1 no login.

**Aceite.** Registro cria conta e redireciona autenticado. Login com credenciais
erradas mostra a mensagem do backend, não uma genérica. Acessar `/biblioteca` sem
cookie redireciona ao login. O token nunca aparece em `document.cookie` nem no
DevTools do lado do cliente.

---

## Fase 2 — Biblioteca e sumário

**Objetivo.** Navegar o acervo e a hierarquia do livro.

```
app/(app)/biblioteca/page.tsx       GET /livros
app/(app)/livros/[id]/page.tsx      GET /livros/:id/sumario
```

O sumário vem como árvore (`SumarioNo[]` com `filhas`). Renderize recursivamente,
com os níveis 1 e 2 expandidos por padrão.

Cards da biblioteca: título, autor e data do último acesso. **Sem percentual.**
A contagem de seções lidas por livro depende de dado que a API ainda não fornece
(ver "Lacunas"); por ora, omita.

**Aceite.** Biblioteca lista os livros do fixture. O sumário renderiza três
capítulos com duas subseções cada, aninhados corretamente. Nenhum percentual na
tela.

---

## Fase 3 — Leitor e panorama

**Objetivo.** A tela central. Texto da seção, navegação e panorama.

```
app/(app)/ler/[secaoId]/page.tsx             GET /secoes/:id
app/(app)/ler/[secaoId]/panorama/page.tsx    GET /secoes/:id/panorama
```

Leiaute de três colunas conforme `UI_RULES.md`, seção 1. A coluna da tutora fica
vazia nesta fase, só com a estrutura.

**Renderização do texto.** `textoCompleto` é string. Preserve parágrafos e
aplique `max-w-[68ch]`. Confirme com o backend se o conteúdo é texto puro,
markdown ou HTML — a resposta muda o renderizador (ver "Perguntas ao backend").

Navegação entre seções por `anterior` e `proxima`, que vêm na resposta.

Panorama como tela intersticial, sem menu lateral, com os quatro níveis na ordem
devolvida e o botão único ao final. Primeira visita a uma seção redireciona para
lá; visitas seguintes mostram o link no topo do leitor.

Controle de tamanho de fonte, três níveis, persistido em `localStorage`.

**Aceite.** Texto renderiza com largura limitada, verificável medindo a coluna.
Panorama mostra exatamente quatro níveis, na ordem recebida. Primeira visita
redireciona ao panorama; segunda não. Modo escuro aplica ao texto da seção.

---

## Fase 4 — Telemetria

**Objetivo.** Instrumentar antes das telas que mais geram evento.

```
lib/telemetria/fila.ts     acumula e envia em lote
app/api/eventos/route.ts   proxy para POST /eventos
```

Acumule em memória e envie a cada 30 segundos, e também no `visibilitychange`
quando a aba perde foco. Lote de 1 a 100 eventos. Reenvio não duplica — a API é
idempotente —, então não é preciso controle de retry sofisticado.

Eventos desta fase: `abriu`, `fechou`, `rolou`, `abriu_panorama`. Os demais
entram nas fases correspondentes.

**Aceite.** Abrir uma seção, rolar e sair produz um lote com os três tipos.
Fechar a aba no meio envia o que estava pendente. Reenviar o mesmo lote não
duplica.

---

## Fase 5 — Fichamento

**Objetivo.** A contribuição principal do sistema.

```
app/(app)/fichamentos/page.tsx          GET /me/fichamentos
app/(app)/fichamentos/[id]/page.tsx     GET /fichamentos/:id
```

Duas entradas de geração: botão no topo do leitor (seção inteira) e seleção de
texto no leitor (ficha de trecho). Para a segunda, monte o `trechoCfi` a partir
do offset da seleção, conforme `UI_RULES.md`, seção 4.1. Os dois campos de trecho
vão juntos.

Editor Tiptap com marcação de origem por parágrafo, legenda e indicador de
`proporcaoAluno` em texto.

`PATCH` ao salvar. Nunca sobrescreve: a API cria nova versão. Mostre o histórico
em `/versoes`.

Exportação só em markdown, com o botão visível no topo.

Eventos: `gerou_fichamento`, `editou_fichamento`.

**Aceite.** Gerar fichamento da seção e de um trecho cria dois registros
distintos. Editar e salvar três vezes produz versões 2, 3 e 4, todas visíveis no
histórico. A marcação de origem distingue visualmente IA e aluno. Não existe
botão de exportar PDF.

---

## Fase 6 — Chat com stream

**Objetivo.** A mediação conversacional.

```
app/api/chat/[sessaoId]/route.ts      repassa o stream, lendo o cookie
components/chat/painel.tsx            'use client'
```

O Route Handler lê o cookie, chama a API e devolve o stream ao cliente. O
componente consome com `fetch` + `ReadableStream`, conforme
`BACKEND_INTEGRATION.md`, seção 5.

Três comportamentos obrigatórios:

- os cinco chips de `UI_RULES.md`, seção 2.1, sem nenhum que peça entrega;
- lista de citações abaixo de cada resposta, com salto por correspondência de
  texto;
- estado de recusa visualmente distinto quando `encontrouBase: false`.

Cancelamento via `AbortController` no cleanup do efeito.

Evento: `clicou_citacao`.

**Aceite.** Mensagem aparece token a token. Citações listadas e clicáveis, com
destaque no texto. Resposta de recusa renderiza em estado distinto, sem lista de
citações. Sair da tela no meio do stream cancela a requisição, verificável na aba
de rede.

---

## Fase 7 — Questões e fluxo step-based

**Objetivo.** O núcleo pedagógico. A fase mais fácil de implementar errado.

```
app/(app)/questoes/[conjuntoId]/page.tsx
```

Os cinco estados de `UI_RULES.md`, seção 3. Derive o estado da resposta da API,
nunca do cliente:

```ts
const ultimo = tentativa.passos.at(-1);
```

Eventos: `respondeu`, `pediu_dica`, `desistiu`.

**Aceite — o mais importante do projeto.** Escreva teste e2e que:

1. responde corretamente e verifica que **nenhum elemento de veredito aparece**
   na tela (sem classe de sucesso, sem ícone de check, sem texto de acerto);
2. responde incorretamente e verifica que a tela é **idêntica** à anterior;
3. confirma que o botão de resolução não existe no DOM nos estados 2 e 3;
4. percorre os três passos e confirma que a trilha fica visível;
5. recarrega a página no meio e confirma que o estado é preservado.

O item 2 é o que impede a regressão que quebraria a seção 2.2 do TCC. Peça esse
teste explicitamente.

---

## Fase 8 — Conceitos, metacognição e reportes

**Objetivo.** Fechar o ciclo da seção.

```
app/(app)/metacognicao/[secaoId]/page.tsx
components/conceitos/listas.tsx
components/reportes/botao.tsx
```

Formulário de metacognição com dois campos abertos e slider de confiança.
Após o POST, exiba `observacaoIa` **apenas** se `sinalizouIlusao` for `true`.
Quando `false`, não mostre nada.

Listas de conceitos de `GET /me/conceitos`. Os de "a revisar" são clicáveis e
levam à seção onde o conceito é introduzido.

Botão de reporte disponível nas telas com conteúdo gerado, enviando `alvoTipo` e
`alvoId` da entidade visível.

Evento: `registrou_metacognicao`.

**Aceite.** Confiança alta com desempenho fraco mostra o card de confronto.
Confiança baixa não mostra nada — nem mensagem alternativa. Conceito sem
tentativa não aparece em nenhuma lista. Reporte a partir de um fichamento envia
`alvoTipo: 'fichamento'` com o id correto.

---

## Fase 9 — Dashboard

**Objetivo.** Entrada do app, só com o que a API fornece.

```
app/(app)/page.tsx     GET /me/progresso
```

Três números: seções abertas, fichamentos criados, fichamentos editados. Mais o
botão de continuar leitura.

**Não exiba** questões respondidas, média de dicas, progresso semanal ou gráfico
de evolução. A API não fornece, e inventar número numa tela que a banca vai ver é
risco desnecessário.

**Aceite.** A tela mostra exatamente os três números de `GET /me/progresso`.
Nenhum valor calculado no cliente a partir de dado parcial.

---

## Lacunas da API

Dados que o planejamento previa e que a API hoje não fornece. Enquanto não
existirem, as telas omitem — não estimam.

| O que falta | Onde afetaria | Sugestão de endpoint |
|---|---|---|
| Última seção lida | Botão "continuar de onde parou" | `GET /me/continuar` |
| Seções lidas por livro | Contagem nos cards da biblioteca | Campo em `LivroSaida` |
| Seções lidas por seção do sumário | Check no sumário | Campo em `SumarioNo` |
| Questões respondidas | Dashboard | Campo em `GET /me/progresso` |
| Média de passos por questão | Dashboard | Campo em `GET /me/progresso` |
| Progresso semanal | Gráfico do dashboard | Agregação por semana |

As três primeiras dá para contornar no cliente, reconstruindo a partir dos
eventos de telemetria que o próprio front envia e mantendo em cache local. É
contorno, não solução: some ao trocar de dispositivo.

As três últimas não têm contorno honesto. Ou o backend expõe, ou as métricas
saem do dashboard.

---

## Perguntas ao backend

Resolver antes da Fase 3.

1. **`textoCompleto` é texto puro, markdown ou HTML?** Muda o renderizador e a
   estratégia de destaque de citação.
2. **O `trecho` do evento `citacao` é literal do `textoCompleto`?** O salto por
   correspondência de texto depende disso. Se vier normalizado ou resumido, o
   destaque não funciona e será preciso outro mecanismo.
3. **Haverá endpoint que sirva o arquivo EPUB?** Se sim, o `ancoraCfi` vira
   utilizável e vale reconsiderar o leitor. Se não, o CFI permanece opaco.
4. **`GET /me/progresso` pode ganhar os campos da tabela de lacunas?**

---

## Ordem e dependências

```
0 Fundação
└─ 1 Autenticação
   └─ 2 Biblioteca e sumário
      └─ 3 Leitor e panorama
         └─ 4 Telemetria
            ├─ 5 Fichamento
            ├─ 6 Chat com stream
            └─ 7 Questões step-based
               └─ 8 Conceitos e metacognição
                  └─ 9 Dashboard
```

Se o prazo apertar, as fases 0 a 6 entregam um sistema que cobre duas das três
lacunas do Capítulo 2. A fase 7 é a que sustenta a seção 2.2, e é a primeira que
eu não cortaria.

---

## Como trabalhar cada fase com o Claude Code

1. Peça o plano da fase antes do código, e confira as rotas contra este
   documento.
2. Tipos e cliente primeiro, depois Server Component, depois interatividade.
3. Ao final, `npm run lint && npm run test && npm run test:e2e`.
4. Commit por fase, mensagem em português, referenciando o número.

Peça os testes de cada critério de aceite. São eles que impedem regressão nas
seis regras do `CLAUDE.md`, sobretudo a primeira — a ausência de veredito —, que
é invisível até alguém olhar a tela com atenção.
