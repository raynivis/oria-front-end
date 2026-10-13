# Tutora Oria — decisões de interface

Cada decisão aqui tem origem no Capítulo 2 do TCC. Este arquivo existe para que a
implementação não invente soluções genéricas em cima de telas que carregam
argumento acadêmico.

Quando houver conflito entre o que parece melhor em UX e o que está escrito aqui,
a regra escrita vence — ou a mudança precisa ser discutida, porque altera o
trabalho.

---

## 1. O leitor de seção

### 1.1 Não usamos epubjs

A API devolve `textoCompleto` já extraído do EPUB, seção por seção. O front
renderiza texto, não o arquivo. Isso elimina `epubjs`, `react-reader`, o
carregamento do arquivo e toda a complexidade de resolver CFI dentro de um
iframe.

Consequência prática: o maior risco técnico do projeto deixou de existir.

### 1.2 Layout

Três colunas em desktop, com colapso progressivo:

```
┌──────────┬───────────────────────────┬──────────────┐
│ Sumário  │  textoCompleto            │  Tutora      │
│ (árvore) │  max 68ch, centralizado   │  (chat)      │
│ 240px    │  destaque de citação      │  360px       │
└──────────┴───────────────────────────┴──────────────┘
```

Abaixo de 1024px, o painel da tutora vira gaveta lateral. Abaixo de 768px, o
sumário vira menu.

**Largura máxima de 68 caracteres** na coluna de texto (`max-w-[68ch]`). Linha
longa aumenta carga cognitiva extrínseca sem acrescentar informação (Sweller,
1988). É a decisão de design mais barata e mais fundamentada do projeto.

**O painel da tutora é lateral, nunca modal.** Modal interrompe a leitura;
painel mantém o texto visível enquanto o diálogo acontece. A sessão é ancorada em
`sectionId`, então a tutora sempre sabe onde o aluno está.

### 1.3 Topo da coluna de leitura

Três elementos, nesta ordem:

```
Capítulo 3
Heurísticas e Vieses
[Ver panorama da seção]            [Gerar fichamento desta seção]
```

O link do panorama só aparece se o aluno já passou pela tela — na primeira
visita, ele é redirecionado para lá antes de ver o texto.

### 1.4 Progresso

No sumário lateral, seções já abertas recebem um check discreto. No topo, a
contagem:

> 3 de 6 seções lidas

**Nunca percentual.** Nem barra de progresso proporcional. Contagem orienta sem
criar meta numérica, e meta numérica induz à corrida pela conclusão em vez da
compreensão (Zhang et al., 2025).

A informação de quais seções foram abertas vem da telemetria enviada pelo próprio
front. Mantenha em cache local durante a sessão e reconcilie com
`GET /me/progresso` ao carregar.

---

## 2. O chat da tutora

### 2.1 Atalhos de sugestão

Cinco chips, exatamente estes:

```
Quero explicar isso com minhas palavras
Onde o texto sustenta essa ideia?
Não entendi esta parte, me ajude a chegar lá
Como isso se liga ao capítulo anterior?
Me teste sobre o que acabei de ler
```

**Nenhum atalho pode pedir entrega de conteúdo.** "Faça um resumo do capítulo",
"o que devo memorizar", "explique esse conceito" e equivalentes estão proibidos:
são afordâncias de terceirização, e construir a preguiça cognitiva na interface
para depois medi-la é circular (Ferreira, 2025; Kasneci et al., 2023).

Os cinco acima pedem elaboração. A diferença não é cosmética.

### 2.2 Streaming

A rota é `POST /sessoes/:id/mensagens`, com corpo e header de autenticação.
`EventSource` não serve: só faz GET e não aceita header. Use `fetch` +
`ReadableStream`, conforme a implementação de referência em
`BACKEND_INTEGRATION.md`, seção 5.

Esta é a **única** chamada que roda no cliente. Como o token está em cookie
`httpOnly`, o componente não o alcança: exponha o stream através de um Route
Handler que repassa (`app/api/chat/[sessaoId]/route.ts`), lendo o cookie no
servidor e devolvendo o stream ao cliente.

Cancele o stream no `useEffect` de limpeza, via `AbortController`. O backend
detecta a conexão fechada e cancela a chamada ao modelo.

### 2.3 Citações

Os eventos `citacao` alimentam uma lista compacta abaixo da mensagem da tutora:

```
Trechos usados
  "Quando confrontamos uma questão difícil…"    Heurísticas e Vieses
  "O Sistema 1 é especialista em substituir…"   Sistema 1 e Sistema 2
```

Máximo três por resposta. Cada item é clicável.

**Como fazer o salto sem CFI.** O evento traz `trecho` (texto literal) e
`ancoraCfi`. Sem `epubjs`, o CFI não é resolvível, então localize por
correspondência de texto:

1. normalize `trecho` e `textoCompleto` (espaços, acentos, maiúsculas);
2. ache o índice da primeira ocorrência;
3. envolva o intervalo em `<mark>` e dê `scrollIntoView`;
4. se não achar, não quebre: apenas não destaque, e mantenha a citação listada.

Guarde o `ancoraCfi` no estado mesmo sem usá-lo. Se o backend passar a servir o
EPUB, ele vira o mecanismo definitivo.

Clicar numa citação emite o evento de telemetria `clicou_citacao`. Ele mede se o
aluno confere a fonte, que é o comportamento oposto à confiança acrítica.

### 2.4 Estado de recusa

Quando o stream fecha com `encontrouBase: false`, a mensagem é renderizada em
estado distinto:

- fundo âmbar claro, borda esquerda âmbar;
- ícone de alerta;
- texto: "Não encontrei base para isso no material desta seção.";
- sem lista de citações.

Precisa ser **visivelmente diferente** de uma resposta normal. Essa distinção é
avaliada: o critério C4 da Avaliação A mede o reconhecimento de limite, e a
captura dessa tela é evidência no Capítulo 4.

---

## 3. Questões — o fluxo step-based

A tela mais importante do produto e a mais fácil de errar.

### 3.1 Os cinco estados

```
Estado 1 — questão aberta
  enunciado
  [campo de resposta livre]
  (Responder)

Estado 2 — passo 1
  ┌ sua resposta ─────────────────┐  (recolhida, cinza)
  │ …                             │
  └───────────────────────────────┘
  Tutora: "Antes de eu comentar: em que trecho você se apoiou?"
  [campo de justificativa]
  (Enviar)          (Preciso de uma dica)

Estado 3 — passo 2
  trilha dos passos anteriores, empilhada e visível
  Tutora: dica conceitual
  [campo de nova tentativa]
  (Enviar)          (Preciso de outra dica)

Estado 4 — passo 3
  trilha
  Tutora: dica localizada, com link "Ver no texto"
  [campo de nova tentativa]
  (Enviar)          (Ver resolução)

Estado 5 — resolução
  trilha completa
  resolução comentada, agora com veredito
```

### 3.2 Regras que a UI precisa garantir

**Nenhum veredito antes do estado 5.** Sem verde, sem vermelho, sem ícone de
check ou X, sem "quase lá", sem animação de acerto. A API não manda campo
`correto` — a UI não pode inventá-lo. A mesma tela aparece para resposta certa e
errada.

**A trilha fica visível.** Os passos anteriores empilhados tornam o processo
tangível, que é o argumento central do step-based.

**O botão de resolução só existe no estado 4.** Antes disso, apenas "Preciso de
uma dica". Não compute o estado no cliente: olhe `passos.at(-1).tipo` e
`estado` na resposta da API. Pedir resolução cedo devolve 400, e a UI não deve
chegar a esse ponto.

**Indicador discreto de posição:** "Passo 2 de 3". Discreto, não barra de
progresso.

**Tentativa encerrada não aceita mais passos.** Quando `estado` for `resolvida`
ou `abandonada`, desabilite os campos. Postar de novo devolve 400.

### 3.3 Como ler a resposta da API

`POST /tentativas/:id/passos` devolve a tentativa inteira atualizada. Não tente
adivinhar o próximo estado: derive da resposta.

```ts
const ultimo = tentativa.passos.at(-1);
if (tentativa.estado === 'resolvida') mostrarResolucao();
else if (ultimo?.tipo === 'pedido_justificativa') mostrarCampoJustificativa();
else if (ultimo?.tipo === 'dica_conceitual') mostrarCampoTentativa();
else if (ultimo?.tipo === 'dica_localizada') mostrarCampoTentativaComBotaoResolucao();
```

---

## 4. Fichamento

### 4.1 Duas origens

```
POST /secoes/:id/fichamento                              → fichamento da seção
POST /secoes/:id/fichamento { trechoCfi, trechoTexto }   → ficha do trecho
```

Os dois campos de trecho vão **juntos ou nenhum**. Como não usamos `epubjs`, não
há CFI real disponível no front; gere um identificador próprio e estável a partir
do offset da seleção, por exemplo `offset:1240-1398`, e mande no `trechoCfi`.
O backend trata como string opaca.

Cada combinação seção + trecho é um fichamento separado, com trilha de versões
própria.

### 4.2 Marcação de origem

O editor precisa deixar visível o que é da IA e o que é do aluno. Faixa vertical
fina na margem esquerda de cada parágrafo:

- cinza claro: texto gerado pela IA;
- azul: texto escrito ou reescrito pelo aluno.

Com legenda discreta acima do editor:

```
▏Texto gerado pela IA    ▎Texto escrito ou reescrito por você
```

A origem vem de `origemVersaoAtual` no nível do fichamento. Para marcação por
parágrafo, compare a versão atual com a primeira versão de origem `ia`, obtida em
`GET /fichamentos/:id/versoes`, e marque como do aluno os parágrafos que
divergirem.

Isso tem função dupla: dá ao aluno consciência de quanto do material é dele, e
gera o dado da métrica de elaboração ativa do Capítulo 5.

### 4.3 Indicador de elaboração

`proporcaoAluno` vem pronto da API. Exiba como texto, não como barra:

> 42% do texto atual é seu

Barra de progresso aqui recriaria a lógica de meta que a regra 5 do `CLAUDE.md`
rejeita.

### 4.4 Exportação

Só markdown. `?formato=pdf` devolve 400 — não ofereça o botão.

Mantenha a exportação visível no topo da tela. O artefato precisa sair do
sistema: é o que fecha a lacuna 2 do Capítulo 2.

---

## 5. Panorama

Tela intersticial, sem menu lateral, antes de abrir uma seção pela primeira vez.

Quatro níveis rotulados, na ordem que a API devolve, do geral ao específico:

```
Panorama · Capítulo 3
Heurísticas e Vieses
Leitura estimada: 18 minutos

Ideia mais geral
  Julgamento sob incerteza
  …

Mecanismo central
  Substituição de perguntas
  …

Consequência
  …

Casos específicos
  …

            [Começar a leitura]
```

Acima dos níveis, uma frase que explicita o princípio ao aluno:

> A ordem abaixo vai do mais geral ao mais específico: comece pelo
> enquadramento, depois observe o mecanismo e só então os casos particulares.

Tornar a diferenciação progressiva (Moreira, 1999) perceptível, e não apenas
implementada, é o que diferencia esta tela de um resumo comum.

A primeira chamada pode demorar alguns segundos — é geração de LLM. Spinner
normal basta; as seguintes vêm do cache.

---

## 6. Metacognição

Tela de fechamento da seção.

```
O que você acredita que aprendeu?
[textarea]

O que ainda gera dúvidas?
[textarea]

Nível de confiança
[slider 0–100]          72%
Inseguro ←——————→ Confiante

(Registrar)
```

Após o POST, se `sinalizouIlusao` for `true`, exiba `observacaoIa` em card de
destaque:

> **Possível ilusão de conhecimento:** você declarou confiança de 72%, mas
> precisou dos três passos em 4 das 5 questões desta seção.

**Se `sinalizouIlusao` for `false`, `observacaoIa` vem `null` e nada é exibido.**
Não invente mensagem de parabéns: ausência de alerta não é elogio, e inventar
texto aqui contamina a operacionalização da compreensão ilusória de Flavell
(1979).

Abaixo, as duas listas de conceitos, vindas de `GET /me/conceitos`:

```
Conceitos dominados       (chips estáticos)
Conceitos para revisar    (chips clicáveis → levam à seção do conceito)
```

Conceito sem tentativa registrada não aparece em lista nenhuma — a API já faz
esse corte. Não preencha com placeholder.

---

## 7. Dashboard

Enxuto, e só com o que a API fornece hoje.

```
Olá, {nome}
Retome a leitura e elabore o que compreendeu.

[Seções abertas]  [Fichamentos criados]  [Editados por você]

[Continuar leitura →]
```

Os três números vêm de `GET /me/progresso`. **Não exiba** questões respondidas,
média de dicas, progresso semanal ou compreensão média: a API não fornece, e
número fabricado numa tela que a banca vai ver é risco desnecessário.

Ver `IMPLEMENTATION.md`, "Lacunas da API", para o que pedir ao backend se quiser
o dashboard completo.

---

## 8. Tema e tipografia

### 8.1 Paleta

Seguir a do protótipo BookMind AI. Antes de implementar, extraia os tokens de
cor, raio de borda, escala tipográfica e espaçamento e registre-os em
`globals.css` e `tailwind.config.ts`. Fazer isso no passo zero evita reconstruir
cada tela com valores aproximados e terminar com dois sistemas visuais
convivendo.

### 8.2 Modo escuro

Entra no escopo. É a decisão mais justificável do lote: leitura prolongada em
fundo claro é desconforto real.

**Toda cor precisa ser token semântico** (`--surface`, `--text-primary`,
`--border`), nunca literal. Um `#fff` esquecido só aparece no modo escuro, e
geralmente tarde.

`next-themes` com `attribute="class"`, para evitar o flash de tema claro na
hidratação.

Sem `epubjs`, não há mais o problema do iframe com estilo próprio: o texto da
seção é renderizado pelo próprio app e herda o tema.

### 8.3 Controle de leitura

No leitor, ofereça ajuste de tamanho de fonte (três níveis). Custa pouco e
conversa com a mesma justificativa de conforto do modo escuro.

---

## 9. Biblioteca

Cards com título, autor, contagem de seções lidas e data do último acesso.

**Sem percentual de progresso.** A regra 5 vale em todo o produto, não só no
leitor.

Hoje `GET /livros` não devolve contagem de seções lidas por livro. Enquanto não
devolver, mostre apenas título, autor e último acesso. Ver "Lacunas da API".
