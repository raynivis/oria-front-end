# Integração com o backend (oria-api)

Este documento descreve como o frontend (Next.js 16, App Router) se conecta à
API da Tutora Oria, em `C:\Users\juxif\Documents\GitHub\oria-api\oria-api`
(NestJS). Cobre autenticação, formato de erros, todos os endpoints disponíveis
e o único ponto realmente não trivial: o chat por streaming (SSE via POST).

Gerado a partir do código do backend (controllers, DTOs, guards, filtro de
exceções), não da documentação dele — se algo aqui divergir do que a API
realmente faz depois de uma mudança no backend, o código do backend é a fonte
da verdade.

---

## 0. Antes de começar — dois bloqueios reais

**1. CORS não está configurado no backend.** Nenhuma chamada do navegador vai
funcionar (nem GET) até isso ser resolvido, porque o frontend roda em uma
origem diferente da API. Duas saídas:

- Pedir para adicionar no `bootstrap.ts` do backend:
  ```ts
  app.enableCors({
    origin: 'http://localhost:3001', // origem do frontend em dev
    credentials: true,               // só necessário se usar cookies (ver seção 2)
  });
  ```
- Ou não depender de CORS: fazer todas as chamadas através de Route Handlers
  do Next.js (`app/api/.../route.ts`), que rodam no servidor e chamam a API
  por trás — o navegador só fala com o próprio Next.js, mesma origem. É a
  abordagem recomendada neste documento (seção 2) porque também resolve o
  armazenamento do token com mais segurança.

**2. Conflito de porta em dev.** `next dev` e o backend (`PORT` no `.env` do
backend) usam `3000` por padrão. Rode o frontend em outra porta:

```bash
npm run dev -- -p 3001
```

---

## 1. Convenções gerais

- **Base URL:** tudo fica sob `/api/v1`, **exceto** `GET /health`, que fica em
  `/health` puro (sem prefixo). Em dev, com o backend na porta padrão:
  `http://localhost:3000/api/v1`.
- **Autenticação:** JWT Bearer. Toda rota exige
  `Authorization: Bearer <token>`, **exceto** as listadas como `[Public]` ou
  `[AdminKey]` na referência da seção 4.
- **Sem refresh token.** Não existe endpoint de logout nem de renovação. O
  token dura o que `JWT_EXPIRES_IN` disser (padrão `7d` no backend). Ao tomar
  um 401, a única saída é mandar o usuário para o login de novo.
- **`ValidationPipe` não transforma tipos.** O backend roda com
  `{ whitelist: true }` apenas — sem `transform: true`. Campos extras no corpo
  são silenciosamente removidos (não dá erro), mas isso não afeta o frontend
  enviando os campos certos.

---

## 2. Autenticação

### 2.1 Fluxo

```
POST /api/v1/auth/registro   { nome, email, senha }  -> 201
POST /api/v1/auth/login      { email, senha }         -> 200
```

Os dois devolvem o mesmo formato:

```ts
type AutenticacaoSaida = {
  token: string; // JWT, assinar em "Authorization: Bearer <token>" daqui pra frente
  user: { id: string; nome: string; email: string; criadoEm: string };
};
```

Validações do corpo (`senha` tem regras diferentes entre registro e login):

```ts
// registro
{ nome: string (min 1), email: string (formato de e-mail), senha: string (min 8) }
// login
{ email: string (formato de e-mail), senha: string (min 1) }
```

Erros possíveis: `409` e-mail já cadastrado (registro), `401` credenciais
inválidas (login — mesma mensagem genérica tanto para e-mail inexistente
quanto senha errada, de propósito).

### 2.2 Onde guardar o token (recomendado)

Como o backend não seta cookie nenhum — ele só devolve o JWT no corpo da
resposta — quem decide como guardar é o frontend. Para um app Next.js App
Router, a opção mais segura é um **Route Handler que faz proxy do login e
seta um cookie `httpOnly`**, em vez de guardar o token em `localStorage`
(mais exposto a XSS) ou em estado de cliente.

```ts
// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const corpo = await request.json();
  const resposta = await fetch(`${process.env.API_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });

  if (!resposta.ok) {
    const erro = await resposta.json();
    return NextResponse.json(erro, { status: resposta.status });
  }

  const dados = await resposta.json();
  const res = NextResponse.json({ user: dados.user });
  res.cookies.set('oria_token', dados.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias, acompanhar JWT_EXPIRES_IN do backend
  });
  return res;
}
```

Esse padrão usa `API_URL` (sem `NEXT_PUBLIC_`, porque só o servidor Next.js
precisa dele — o navegador nunca fala direto com o backend). Dali em diante,
toda chamada à API sai de Server Components/Route Handlers, que leem o cookie
com `cookies().get('oria_token')` e repassam como `Authorization: Bearer`.

Isso também contorna o problema de CORS da seção 0 por completo: o navegador
só conversa com o próprio domínio do Next.js.

Se preferir algo mais rápido para prototipar (sem essa camada de proxy),
guardar o token em `localStorage` e montar o header manualmente no cliente
funciona, mas exige resolver CORS de verdade no backend (`enableCors`) e abre
mão da proteção contra XSS do `httpOnly`.

### 2.3 Perfil do usuário autenticado

```
GET /me   -> { id, nome, email, criadoEm }
```

---

## 3. Formato de erro

Todo erro passa por um filtro global que sempre acrescenta `statusCode`,
`timestamp` e `path`. Mas o corpo varia dependendo de como o backend lançou o
erro — **nem todo erro tem o campo `error`**:

```jsonc
// exceção lançada com uma string (NotFoundException('Sessão não encontrada.'), etc.)
{
  "message": "Sessão não encontrada.",
  "statusCode": 404,
  "timestamp": "2026-10-11T12:00:00.000Z",
  "path": "/api/v1/sessoes/<id>"
}

// falha de validação do DTO (class-validator) — essa SIM tem "error"
{
  "message": ["senha must be longer than or equal to 8 characters"],
  "error": "Bad Request",
  "statusCode": 400,
  "timestamp": "2026-10-11T12:00:00.000Z",
  "path": "/api/v1/auth/registro"
}

// erro não tratado (500) — nunca vaza stack trace
{
  "message": "Erro interno do servidor",
  "statusCode": 500,
  "timestamp": "...",
  "path": "..."
}
```

Nos dois primeiros casos `message` pode ser `string` ou `string[]`
(validação de DTO sempre manda array, um item por regra violada). Um parser
de erro defensivo no frontend:

```ts
type ErroApi = { message: string | string[]; statusCode: number; error?: string };

function mensagemDeErro(corpo: ErroApi): string {
  return Array.isArray(corpo.message) ? corpo.message.join(' ') : corpo.message;
}
```

---

## 4. Referência de endpoints

`[JWT]` = precisa de `Authorization: Bearer <token>` (padrão, é o que vale se
nada for dito). `[Public]` = sem autenticação. `[AdminKey]` = header
`x-admin-api-key` (rotas de backoffice — ingestão de livro e métricas; **não
chamar a partir do app do aluno**).

### Catálogo

```
GET  /livros                 [JWT]  -> LivroSaida[]
GET  /livros/:id              [JWT]  -> LivroSaida
GET  /livros/:id/sumario      [JWT]  -> SumarioNo[]   (árvore do sumário)
GET  /secoes/:id              [JWT]  -> SecaoSaida
```

```ts
type LivroSaida = { id: string; titulo: string; autor: string; isbn?: string; criadoEm: string };
type SumarioNo = { id: string; titulo: string; nivel: number; ordem: number; href: string; filhas: SumarioNo[] };
type SecaoSaida = {
  id: string; titulo: string; textoCompleto: string;
  livro: { id: string; titulo: string };
  anterior: { id: string; titulo: string } | null;
  proxima: { id: string; titulo: string } | null;
};
```

`GET /livros` só lista livros com ingestão concluída (`status: 'pronto'`).

### Panorama (visão geral da seção, 4 níveis)

```
GET /secoes/:id/panorama   [JWT]  -> PanoramaSaida
```

```ts
type PanoramaSaida = {
  niveis: Array<{ rotulo: string; titulo: string; texto: string }>; // sempre 4, ordem fixa
  tempoEstimadoMin: number;
};
```

Primeira chamada gera (pode demorar alguns segundos, é uma chamada de LLM);
chamadas seguintes vêm do cache instantaneamente. Não precisa de loading
otimista além de um spinner normal.

### Fichamentos

```
POST   /secoes/:id/fichamento        [JWT]  { trechoCfi?, trechoTexto? }  -> FichamentoSaida
GET    /fichamentos/:id              [JWT]  -> FichamentoSaida
PATCH  /fichamentos/:id              [JWT]  { conteudo }                 -> FichamentoSaida
GET    /fichamentos/:id/versoes      [JWT]  -> FichamentoVersaoSaida[]
DELETE /fichamentos/:id              [JWT]  -> 204, sem corpo
GET    /me/fichamentos               [JWT]  ?livroId=<uuid>              -> FichamentoResumoDto[]
GET    /me/fichamentos/exportar      [JWT]  ?formato=md                  -> texto markdown (download)
```

```ts
type FichamentoSaida = {
  id: string; sectionId: string; trechoCfi: string | null;
  numeroVersaoAtual: number; origemVersaoAtual: 'ia' | 'aluno';
  conteudo: string;
  caracteresIa: number; caracteresAluno: number; proporcaoAluno: number;
  criadoEm: string; atualizadoEm: string;
};
type FichamentoVersaoSaida = {
  numero: number; conteudo: string; origem: 'ia' | 'aluno';
  promptVersao?: number; modelo?: string; criadoEm: string;
};
type FichamentoResumoDto = {
  id: string; sectionId: string; tituloSecao: string; livroId: string; tituloLivro: string;
  trechoCfi: string | null; origemVersaoAtual: 'ia' | 'aluno'; editado: boolean; atualizadoEm: string;
};
```

Pontos importantes:
- **`POST` sem corpo** gera o fichamento da seção inteira. **Com**
  `trechoCfi` + `trechoTexto`, gera uma ficha ancorada naquele recorte (os
  dois precisam vir juntos). Cada combinação seção+trecho é um fichamento
  separado — gerar duas fichas de trechos diferentes na mesma seção cria dois
  registros distintos, cada um com sua própria trilha de versões.
- **`PATCH` nunca sobrescreve** — sempre cria uma versão nova. É assim que
  dá pra mostrar "o que a IA escreveu" vs. "o que o aluno reescreveu"
  (`origemVersaoAtual`, e o histórico completo em `/versoes`).
- `?formato=pdf` em `/exportar` devolve `400` — só markdown existe por
  enquanto.
- `proporcaoAluno` é a métrica de elaboração ativa (quanto do texto atual é
  diferente do rascunho original da IA) — dá pra usar direto num indicador
  visual tipo barra de progresso.

### Telemetria

```
POST /eventos         [JWT]  { eventos: Evento[] }   -> { recebidos, gravados }
GET  /me/progresso     [JWT]  -> { secoesAbertas, fichamentos: { total, comEdicaoDoAluno } }
```

```ts
type TipoEvento =
  | 'abriu' | 'fechou' | 'rolou' | 'abriu_panorama' | 'gerou_fichamento'
  | 'editou_fichamento' | 'respondeu' | 'pediu_dica' | 'desistiu'
  | 'clicou_citacao' | 'registrou_metacognicao';

type Evento = { tipo: TipoEvento; sectionId?: string; criadoEm: string /* ISO 8601 */; payload?: Record<string, unknown> };
```

Pense nisso como telemetria "fire and forget": acumule eventos no cliente e
mande em lote a cada ~30s (1 a 100 por chamada). Reenviar o mesmo lote não
duplica (idempotente por usuário+tipo+seção+instante, truncado ao segundo) —
então não precisa se preocupar com retry duplicando dado.

### Questões, conceitos e tentativas (fluxo step-based)

```
GET  /secoes/:id/conceitos        [JWT]  -> ConceitoSaida[]
GET  /me/conceitos                [JWT]  -> { dominados: ConceitoClassificado[], aRevisar: ConceitoClassificado[] }
POST /secoes/:id/questoes         [JWT]  { conceitoIds?: string[] }  -> ConjuntoSaida
GET  /conjuntos/:id               [JWT]  -> ConjuntoSaida
POST /questoes/:id/tentativas     [JWT]  { resposta: string }       -> TentativaSaida
POST /tentativas/:id/passos       [JWT]  { tipo, conteudo? }         -> TentativaSaida
POST /tentativas/:id/desistir     [JWT]  -> TentativaSaida
GET  /tentativas/:id              [JWT]  -> TentativaSaida
```

```ts
type ConceitoSaida = { id: string; nome: string; descricaoCurta: string };
type ConceitoClassificado = { conceitoId: string; nome: string; sectionId: string; tituloSecao: string };
type ConjuntoSaida = {
  id: string; sectionId: string; criadoEm: string;
  questoes: Array<{ id: string; ordem: number; enunciado: string; conceitos: Array<{ id: string; nome: string }> }>;
};
type TentativaSaida = {
  id: string; questaoId: string;
  estado: 'aberta' | 'em_passos' | 'resolvida' | 'abandonada';
  nPassos: number; criadaEm: string; encerradaEm: string | null;
  passos: Array<{
    numero: number;
    tipo: 'pedido_justificativa' | 'dica_conceitual' | 'dica_localizada' | 'justificativa_aluno' | 'resolucao';
    conteudo: string;
    criadoEm: string;
  }>;
};
```

**Isto é o coração pedagógico do sistema — a UI precisa respeitar a máquina
de estados, não tentar adivinhar o próximo passo:**

1. `POST /questoes/:id/tentativas` devolve só o primeiro passo
   (`pedido_justificativa`). **Nunca há veredito de certo/errado em nenhuma
   resposta** — nem campo `correto`, nem cor, nem ícone. A UI não pode
   inventar um sinal de acerto que a API não manda.
2. Pra continuar, `POST /tentativas/:id/passos` com
   `{ tipo: 'justificativa_aluno', conteudo: '<texto do aluno>' }`. A
   resposta é sempre a tentativa inteira atualizada (`passos` com a nova
   entrada); olhe `passos.at(-1).tipo` pra saber o que mostrar (nova dica,
   ou a tentativa virou `estado: 'resolvida'`).
3. **Pedir a resolução antes da hora dá `400`.** Só peça
   `{ tipo: 'resolucao' }` quando o backend já tiver mandado 3 dicas
   (`nPassos >= 3` — mas trate como "o botão de resolução só aparece quando
   o próprio fluxo chegar lá", não compute isso no cliente).
4. `POST /tentativas/:id/desistir` libera a resolução a qualquer momento.
5. Uma tentativa com `estado` em `resolvida` ou `abandonada` está encerrada —
   não poste mais passos nela (dá `400`).

`POST /secoes/:id/questoes` sem `conceitoIds` gera sobre todos os conceitos
da seção; com `conceitoIds`, restringe (é o que sustenta "gerar nova rodada
sobre os conceitos que ficaram como 'a revisar'" — pegue os ids de
`GET /me/conceitos`).

### Diálogo (chat) — ver seção 5, é streaming

```
POST /sessoes             [JWT]  { secaoId: string }  -> SessaoSaida (201)
GET  /sessoes/:id          [JWT]  -> SessaoSaida
POST /sessoes/:id/mensagens [JWT]  { conteudo: string } -> SSE (ver seção 5)
GET  /me/sessoes           [JWT]  -> SessaoResumo[]
```

```ts
type SessaoSaida = {
  id: string; sectionId: string; tituloSecao: string; criadaEm: string;
  mensagens: Array<{
    id: string; papel: 'aluno' | 'tutora'; conteudo: string;
    chunksCitados: string[]; encontrouBase: boolean | null; criadoEm: string;
  }>;
};
type SessaoResumo = { id: string; sectionId: string; tituloSecao: string; criadaEm: string };
```

Uma sessão é sempre presa a uma seção — não existe chat "solto". `encontrouBase`
só é preenchido em mensagens da tutora (`null` nas do aluno).

### Metacognição e reportes

```
GET  /secoes/:id/metacognicao   [JWT]  -> MetacognicaoSaida[]
POST /secoes/:id/metacognicao   [JWT]  { oQueAprendi, oQueDuvido, confianca: 0..100 }  -> MetacognicaoSaida
GET  /me/metacognicao            [JWT]  -> MetacognicaoSaida[]
POST /reportes                   [JWT]  { alvoTipo: string, alvoId: string, descricao: string }  -> ReporteSaida
GET  /me/reportes                 [JWT]  -> ReporteSaida[]
```

```ts
type MetacognicaoSaida = {
  id: string; sectionId: string; tituloSecao: string;
  oQueAprendi: string; oQueDuvido: string; confianca: number;
  observacaoIa: string | null; sinalizouIlusao: boolean; criadoEm: string;
};
type ReporteSaida = {
  id: string; alvoTipo: string; alvoId: string; descricao: string;
  status: 'aberto' | 'analisado' | 'corrigido'; criadoEm: string;
};
```

`observacaoIa` só vem preenchido quando `sinalizouIlusao` é `true`
(confiança declarada alta, mas desempenho fraco nas questões da seção) — é o
texto pra mostrar de confronto. Quando `false`, é `null`: não mostre nada, não
invente uma mensagem de "parabéns".

`alvoTipo`/`alvoId` em `POST /reportes` servem pra apontar o que está sendo
reportado — por exemplo `alvoTipo: 'fichamento'`, `alvoId: <id do
fichamento>`. Use o id da entidade que o aluno estava vendo quando clicou em
"reportar problema".

### Rotas de backoffice (não usar no app do aluno)

```
POST /admin/livros/ingerir        [AdminKey]
GET  /admin/jobs/:jobId           [AdminKey]
GET  /admin/metricas/ultimas-chamadas  [AdminKey]  ?limite=20
```

Essas três exigem o header `x-admin-api-key` em vez de JWT. São ferramentas
de operação/pesquisa (ingestão de EPUB, acompanhamento da fila, métricas de
custo/latência das chamadas de LLM) — não fazem parte do produto que o aluno
usa, e a chave não deve existir em código que roda no navegador.

### Health check

```
GET /health   [Public]   (sem prefixo /api/v1)
```

---

## 5. Chat por streaming — `POST /sessoes/:id/mensagens`

Esta é a única rota que não é JSON request/response simples. **Não dá para
usar `EventSource` do navegador**, porque `EventSource` só faz `GET` e não
permite mandar corpo nem header `Authorization` — e esta rota é `POST` com
corpo e exige o Bearer token normal. É preciso ler o corpo da resposta como
stream manualmente.

### Headers da resposta

```
Content-Type: text/event-stream; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive
```

### Eventos possíveis

```
event: token
data: {"texto": "pedaço de texto gerado"}
```
Zero ou mais vezes, conforme o modelo gera. Concatene `texto` na ordem de
chegada pra montar a resposta indo aparecendo na tela.

```
event: citacao
data: {"chunkId": "uuid", "trecho": "...", "ancoraCfi": "epubcfi(...)", "secaoTitulo": "..."}
```
Zero ou mais vezes — uma por trecho do livro efetivamente citado na resposta.
Use `ancoraCfi` pra linkar de volta ao ponto exato do texto no leitor.

```
event: fim
data: {"messageId": "uuid", "encontrouBase": true}
```
Sempre a última coisa em caso de sucesso. `encontrouBase: false` é a recusa
("a tutora não achou base no material pra responder isso") — trate
visualmente diferente de uma resposta normal (é um requisito do produto, não
só estética: o sistema nunca "inventa" quando não tem embasamento).

```
event: erro
data: {"mensagem": "Não foi possível gerar a resposta agora. Tente de novo."}
```
No lugar de `fim`, quando algo falhou no meio da geração. Mostre a mensagem e
deixe o aluno tentar de novo.

### Implementação de referência (fetch + ReadableStream)

```ts
// lib/chat-stream.ts
type EventoChat =
  | { tipo: 'token'; texto: string }
  | { tipo: 'citacao'; chunkId: string; trecho: string; ancoraCfi: string; secaoTitulo: string }
  | { tipo: 'fim'; messageId: string; encontrouBase: boolean }
  | { tipo: 'erro'; mensagem: string };

export async function* enviarMensagem(
  sessaoId: string,
  conteudo: string,
  token: string,
): AsyncGenerator<EventoChat> {
  const resposta = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL}/sessoes/${sessaoId}/mensagens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ conteudo }),
  });

  if (!resposta.ok || !resposta.body) {
    throw new Error(`Falha ao iniciar o stream (status ${resposta.status}).`);
  }

  const leitor = resposta.body.getReader();
  const decodificador = new TextDecoder();
  let pendente = '';

  while (true) {
    const { done, value } = await leitor.read();
    if (done) break;

    pendente += decodificador.decode(value, { stream: true });
    const blocos = pendente.split('\n\n');
    pendente = blocos.pop() ?? '';

    for (const bloco of blocos) {
      const linhaEvento = bloco.match(/^event: (.+)$/m)?.[1];
      const linhaDados = bloco.match(/^data: (.+)$/m)?.[1];
      if (!linhaEvento || !linhaDados) continue;

      const dados = JSON.parse(linhaDados);
      yield { tipo: linhaEvento, ...dados } as EventoChat;
    }
  }
}
```

Uso num componente de chat (lado cliente, `'use client'`):

```ts
let textoAcumulado = '';
for await (const evento of enviarMensagem(sessaoId, pergunta, token)) {
  if (evento.tipo === 'token') {
    textoAcumulado += evento.texto;
    setRespostaParcial(textoAcumulado);
  } else if (evento.tipo === 'citacao') {
    setCitacoes((atual) => [...atual, evento]);
  } else if (evento.tipo === 'fim') {
    setEncontrouBase(evento.encontrouBase);
  } else if (evento.tipo === 'erro') {
    setErro(evento.mensagem);
  }
}
```

Se preferir não escrever o parser à mão, a lib
[`@microsoft/fetch-event-source`](https://github.com/Azure/fetch-event-source)
faz a mesma coisa (POST + headers customizados + parsing de SSE) com uma API
pronta — vale a pena se o app tiver mais de uma tela com streaming no futuro.

**Cancelamento:** se o componente desmontar no meio do stream (aluno saiu da
tela), chame `leitor.cancel()` ou aborte via `AbortSignal` passado ao
`fetch`. O backend detecta a conexão fechada e cancela a chamada ao modelo do
lado dele também — não é desperdício encerrar cedo.

---

## 6. Variáveis de ambiente do frontend

```bash
# .env.local
API_URL=http://localhost:3000/api/v1       # usado só em Server Components / Route Handlers
# Só defina a variável abaixo se decidir chamar a API direto do navegador
# (exige enableCors no backend — ver seção 0):
# NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

Prefira `API_URL` (sem `NEXT_PUBLIC_`) e mantenha as chamadas no servidor
sempre que possível — é o que evita o problema de CORS e mantém o token fora
do JavaScript do navegador.

---

## 7. Mapeamento cenário → telas (sugestão de prioridade)

Os quatro cenários de uso documentados no backend (`SCENARIOS.md`) são a
referência mais direta do que construir primeiro, porque já foram pensados
como roteiro ponta-a-ponta:

| Tela | Endpoints principais |
|---|---|
| Login / cadastro | `POST /auth/login`, `POST /auth/registro` |
| Biblioteca | `GET /livros` |
| Sumário do livro | `GET /livros/:id/sumario` |
| Leitor de seção | `GET /secoes/:id`, `GET /secoes/:id/panorama`, eventos `abriu`/`fechou`/`rolou` |
| Chat contextual | `POST /sessoes`, `POST /sessoes/:id/mensagens` (streaming) |
| Fichamento | `POST/GET/PATCH /fichamento(s)`, `GET /fichamentos/:id/versoes` |
| Biblioteca de fichamentos | `GET /me/fichamentos`, `GET /me/fichamentos/exportar` |
| Questões (step-based) | `POST /secoes/:id/questoes`, `POST /questoes/:id/tentativas`, `POST /tentativas/:id/passos` |
| Conceitos | `GET /secoes/:id/conceitos`, `GET /me/conceitos` |
| Fechamento da seção | `POST /secoes/:id/metacognicao`, `GET /me/conceitos`, `POST /reportes` |

---

## 8. Resumo do que falta no backend para o frontend funcionar em produção

- **CORS** (seção 0) — ou resolvido no backend, ou contornado com Route
  Handlers como proxy (recomendado, e já cobre o problema de guardar o
  token com segurança).
- **Sem refresh token** — planeje a expiração de sessão (padrão 7 dias) e o
  redirecionamento ao login em qualquer 401.
