# Tutora Oria — frontend

Interface de um tutor de leitura acadêmica. TCC de Sistemas de Informação.

A Oria não entrega resumo pronto: ela ancora o diálogo no texto do livro que o
aluno está lendo, pede elaboração em vez de dar a resposta, e mostra a origem de
cada afirmação. Este repositório é só o frontend — ele consome a API `oria-api`
(NestJS), que roda em outro repositório.

## Stack

Next.js 16 (App Router) + TypeScript, Tailwind CSS, shadcn/ui, TanStack Query,
Tiptap (editor do fichamento), MSW para mocks, Vitest + Playwright para testes.

## Estrutura do repositório

```
oria-front-end/
├── README.md        este arquivo
└── oria-app/        o projeto Next.js — é aqui que você roda tudo
    ├── src/
    ├── docs/         CLAUDE.md, IMPLEMENTATION.md, UI_RULES.md,
    │                 BACKEND_INTEGRATION.md, VALIDATION.md
    ├── mocks/        handlers do MSW
    └── package.json
```

**Importante:** a raiz do repositório não tem `package.json`. Todo comando
(`npm install`, `npm run dev` etc.) precisa ser executado dentro de `oria-app/`,
não na raiz.

## Pré-requisitos

- Node.js 20 ou mais recente
- npm
- Para rodar contra a API real: o repositório `oria-api` clonado e rodando
  separadamente (ver `oria-app/docs/BACKEND_INTEGRATION.md`)

## Instalação

```bash
git clone <url-deste-repositorio>
cd oria-front-end/oria-app
npm install
cp .env.example .env.local
```

Abra `.env.local` e confirme a URL da API (padrão: `http://localhost:3000/api/v1`,
só altere se o `oria-api` rodar em outra porta).

## Como rodar

Há dois jeitos de rodar o frontend, dependendo se você tem o `oria-api` disponível.

### Com o backend real

A API costuma rodar na porta 3000, então suba o frontend numa porta diferente:

```bash
cd oria-app
npx next dev -p 3001
```

Acesse `http://localhost:3001`.

### Sem backend, com dados simulados (MSW)

Útil para desenvolver a interface sem precisar do `oria-api` no ar. Usa dados
fictícios em memória, reiniciados a cada execução:

```bash
cd oria-app
npm run msw:dev
```

Também sobe em `http://localhost:3001`.

## Scripts disponíveis

Rodar sempre dentro de `oria-app/`:

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o Next.js na porta padrão (3000) |
| `npm run msw:dev` | Sobe com API simulada (MSW), na porta 3001 |
| `npm run build` | Build de produção |
| `npm run start` | Roda o build de produção |
| `npm run lint` | ESLint |
| `npm run test` | Testes unitários (Vitest) |
| `npm run test:e2e` | Testes end-to-end (Playwright) |

## Documentação do projeto

Dentro de `oria-app/docs/`:

- **CLAUDE.md** — contexto permanente e as regras pedagógicas que a interface
  não pode violar.
- **IMPLEMENTATION.md** — plano de execução por fases.
- **UI_RULES.md** — decisões de interface e a fundamentação de cada uma.
- **BACKEND_INTEGRATION.md** — contrato da API (fonte da verdade sobre
  endpoints e tipos, mantido pelo time do backend).
- **VALIDATION.md** — o que a validação do TCC exige da interface.
