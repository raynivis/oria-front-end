# Tutora Oria — contexto do frontend

Interface de um tutor de leitura acadêmica. TCC de Sistemas de Informação.
Next.js 16 (App Router) + TypeScript, consumindo a API `oria-api` (NestJS).

Este arquivo é contexto permanente. O plano de execução está em
`IMPLEMENTATION.md`, as decisões de interface e sua fundamentação em
`UI_RULES.md`, o que a validação do TCC exige da interface em `VALIDATION.md`, e
o contrato da API em `BACKEND_INTEGRATION.md` — este último é gerado pelo time do
backend e é a fonte da verdade sobre endpoints e tipos.

---

## O que esta interface é, e o que ela não pode ser

A Oria não é um chatbot ao lado de um leitor. Cada decisão de interface deriva de
uma base pedagógica descrita no Capítulo 2 do TCC. As regras abaixo não são
preferência de design: violá-las invalida o trabalho acadêmico.

**1. A UI nunca inventa um veredito que a API não manda.**
No fluxo de questões, a API jamais devolve "certo" ou "errado" antes da
resolução. Não existe campo `correto` na resposta. A interface não pode suprir
isso com cor, ícone, animação, som ou escolha de palavra. A mesma tela aparece
para resposta certa e errada.
Base: VanLehn (2011), sistemas *step-based*.

**2. Toda resposta da tutora mostra de onde veio.**
Os eventos `citacao` do stream alimentam uma lista visível abaixo da mensagem.
Quando o stream termina com `encontrouBase: false`, a recusa é renderizada em
estado visualmente distinto — não como uma resposta comum.
Base: Salminen et al. (2024), Yan et al. (2024).

**3. A interface pede elaboração, não entrega conteúdo.**
Os atalhos do chat pedem que o aluno explique, localize e relacione. Nenhum
atalho da UI pode dizer "faça um resumo", "o que devo memorizar" ou equivalente.
Base: Ferreira (2025), Kasneci et al. (2023), preguiça cognitiva.

**4. O fichamento mostra o que é do aluno e o que é da IA.**
`origemVersaoAtual` e `proporcaoAluno` vêm prontos da API. A distinção precisa
ser visível no editor, porque é a materialização da lacuna 2 do Capítulo 2 e o
dado da métrica de elaboração ativa.

**5. Nada de progresso em percentual.**
Nem no leitor, nem na biblioteca, nem no dashboard. Percentual induz à corrida
pelo número em vez da compreensão. Use contagem: "3 de 6 seções lidas".
Base: Zhang et al. (2025).

**6. Nenhum número fabricado.**
Se a API não fornece, a tela não exibe. Vale especialmente para o dashboard: há
métricas planejadas que o backend ainda não expõe (ver `IMPLEMENTATION.md`,
"Lacunas da API"). Omitir é correto; inventar não.

---

## Stack

| Camada | Escolha |
|---|---|
| Framework | Next.js 16, App Router, TypeScript estrito |
| Estilo | Tailwind CSS |
| Componentes | shadcn/ui |
| Dados do servidor | TanStack Query |
| Estado de UI | Zustand (painéis, seção atual) |
| Formulários | react-hook-form + Zod |
| Editor do fichamento | Tiptap |
| Tema | next-themes |
| Ícones | lucide-react |
| Mocks de API | MSW (Mock Service Worker) |
| Testes | Vitest + Testing Library + Playwright (e2e) |

**Não usamos `epubjs` nem `react-reader`.** A API entrega `textoCompleto` por
seção, já extraído do EPUB. O front renderiza texto, não o arquivo. Ver
`UI_RULES.md`.

## Comandos

```bash
npm run dev -- -p 3001     # porta 3001: a API ocupa a 3000
npm run build
npm run lint
npm run test               # unit
npm run test:e2e           # Playwright
npm run msw:dev            # dev com mocks, sem backend rodando
```

## Convenções

- Idioma: código, componentes e commits em português, exceto termos técnicos
  consagrados (`token`, `stream`, `chunk`, `payload`).
- **Toda chamada à API sai de Server Component ou Route Handler**, nunca do
  navegador direto. Isso contorna o CORS (não configurado no backend) e mantém o
  JWT em cookie `httpOnly`, fora do alcance de XSS.
- A única exceção é o stream do chat, que precisa rodar no cliente. Ver
  `UI_RULES.md`, seção do chat.
- Tipos da API vivem em `lib/api/tipos.ts`, copiados de `BACKEND_INTEGRATION.md`.
  Quando o backend mudar, atualize ali primeiro.
- Nenhum componente chama `fetch` direto: tudo passa por `lib/api/cliente.ts`,
  que injeta o token e normaliza erros.
- Componentes de servidor por padrão. `'use client'` só onde há estado,
  evento ou stream.

## Armadilhas conhecidas

- **Porta.** `next dev` e a API disputam a 3000. Rode o front na 3001.
- **CORS.** Não está configurado no backend. Se alguma chamada partir do
  navegador, falha silenciosamente em dev. Mantenha tudo em Route Handlers.
- **Erro da API tem formato variável.** `message` pode ser `string` ou
  `string[]`. Use o parser de `lib/api/erros.ts`, nunca `corpo.message` direto.
- **Sem refresh token.** Qualquer 401 significa sessão expirada: limpe o cookie e
  redirecione ao login.
- **SSE não aceita `EventSource`.** A rota do chat é POST com corpo e header de
  autenticação. Use `fetch` + `ReadableStream`.
- **Ficha de trecho exige os dois campos.** `trechoCfi` e `trechoTexto` vão
  juntos ou nenhum. Enviar só um dá erro.
- **Exportação só em markdown.** `?formato=pdf` devolve 400.
- **`observacaoIa` é `null` quando não há ilusão detectada.** Não substitua por
  mensagem de parabéns: ausência de alerta não é elogio.
