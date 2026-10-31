import { test, expect, type Page } from '@playwright/test';

/**
 * IMPLEMENTATION.md, Fase 7 — "o mais importante do projeto". Cobre
 * exatamente os cinco critérios de aceite listados ali, na mesma ordem:
 * 1. responder não mostra nenhum elemento de veredito;
 * 2. responder "errado" produz a mesma tela, estruturalmente, que responder
 *    "certo" (o mock nunca inspeciona o conteúdo da resposta — só a API
 *    decide, e aqui simulamos justamente isso: o mesmo input client-side
 *    não pode nunca inventar um sinal de acerto);
 * 3. o botão de resolução não existe no DOM nos estados 2 e 3;
 * 4. a trilha dos passos anteriores continua visível ao longo do fluxo;
 * 5. recarregar a página no meio preserva o estado.
 */

const SEM_VEREDITO = /\b(certo|correto|incorreto|errado|acertou|errou|parab[ée]ns)\b/i;

async function login(page: Page) {
  await page.request.post('/api/auth/login', {
    data: { email: 'aluna@exemplo.com', senha: 'senha1234' },
  });
}

async function criarConjunto(page: Page) {
  const resposta = await page.request.post('/api/secoes/sec-3-1/questoes');
  return resposta.json() as Promise<{
    id: string;
    questoes: Array<{ id: string; enunciado: string }>;
  }>;
}

function semVeredito(page: Page) {
  return expect(page.getByText(SEM_VEREDITO)).toHaveCount(0);
}

test('fluxo step-based: sem veredito, trilha visível, resolução só no estado 4, estado sobrevive a reload', async ({
  page,
}) => {
  await login(page);
  const conjunto = await criarConjunto(page);
  const [questaoA, questaoB] = conjunto.questoes;

  await page.goto(`/questoes/${conjunto.id}`);

  const cartaoA = page.getByTestId(`cartao-questao-${questaoA.id}`);
  const cartaoB = page.getByTestId(`cartao-questao-${questaoB.id}`);

  // ---- Estado 1 → 2: responde a questão A ------------------------------
  await cartaoA.getByPlaceholder('Escreva sua resposta…').fill('A substituição troca a pergunta difícil pela fácil.');
  await cartaoA.getByRole('button', { name: 'Responder' }).click();

  await expect(cartaoA.getByText('Passo 1 de 3')).toBeVisible();
  await expect(cartaoA.getByText('Sua resposta')).toBeVisible();

  // Critério 1 — nenhum elemento de veredito, nenhum ícone/classe de sucesso.
  await semVeredito(page);
  await expect(page.locator('[class*="lucide-check"]')).toHaveCount(0);
  await expect(page.locator('[class*="text-green"], [class*="bg-green"]')).toHaveCount(0);

  // Critério 3 — resolução não existe no DOM no estado 2.
  await expect(cartaoA.getByRole('button', { name: 'Ver resolução' })).toHaveCount(0);

  // ---- Critério 2: responde a questão B com algo "errado" --------------
  // O ponto não é que o conteúdo seja de fato ruim — é que não existe
  // sinal de certo/errado em lugar nenhum da API, então as duas telas têm
  // exatamente a mesma estrutura.
  await cartaoB.getByPlaceholder('Escreva sua resposta…').fill('não sei, só um palpite qualquer aqui');
  await cartaoB.getByRole('button', { name: 'Responder' }).click();

  await expect(cartaoB.getByText('Passo 1 de 3')).toBeVisible();
  await expect(cartaoB.getByRole('button', { name: 'Ver resolução' })).toHaveCount(0);
  await expect(cartaoA.getByRole('button', { name: 'Preciso de uma dica' })).toBeVisible();
  await expect(cartaoB.getByRole('button', { name: 'Preciso de uma dica' })).toBeVisible();
  await semVeredito(page);

  // ---- Estado 2 → 3 (só avança a questão A) -----------------------------
  await cartaoA.getByPlaceholder('Escreva aqui…').fill('Me apoiei no segundo parágrafo.');
  await cartaoA.getByRole('button', { name: 'Enviar' }).click();

  await expect(cartaoA.getByText('Passo 2 de 3')).toBeVisible();
  // Critério 4 — a trilha anterior continua visível, não é substituída.
  await expect(cartaoA.getByText('Antes de eu comentar')).toBeVisible();
  await expect(cartaoA.getByText('Pense no mecanismo central')).toBeVisible();
  await expect(cartaoA.getByRole('button', { name: 'Ver resolução' })).toHaveCount(0);
  await semVeredito(page);

  // ---- Critério 5: recarregar no meio do fluxo preserva o estado --------
  await page.reload();
  await expect(cartaoA.getByText('Passo 2 de 3')).toBeVisible();
  await expect(cartaoA.getByText('Sua resposta')).toBeVisible();
  await expect(cartaoA.getByText('Antes de eu comentar')).toBeVisible();

  // ---- Estado 3 → 4 ------------------------------------------------------
  await cartaoA.getByPlaceholder('Escreva aqui…').fill('A pergunta fácil substitui a difícil.');
  await cartaoA.getByRole('button', { name: 'Enviar' }).click();

  await expect(cartaoA.getByText('Passo 3 de 3')).toBeVisible();
  await expect(cartaoA.getByText('Ver no texto')).toBeVisible();
  // Só agora o botão de resolução existe no DOM.
  await expect(cartaoA.getByRole('button', { name: 'Ver resolução' })).toBeVisible();
  await semVeredito(page);

  // Trilha completa ainda visível.
  await expect(cartaoA.getByText('Antes de eu comentar')).toBeVisible();
  await expect(cartaoA.getByText('Pense no mecanismo central')).toBeVisible();

  // ---- Estado 5: resolução -----------------------------------------------
  await cartaoA.getByRole('button', { name: 'Ver resolução' }).click();

  await expect(cartaoA.getByText('Resolução')).toBeVisible();
  await expect(cartaoA.getByRole('button', { name: 'Ver resolução' })).toHaveCount(0);
  await expect(cartaoA.getByRole('button', { name: 'Enviar' })).toHaveCount(0);
  // Mesmo na resolução, sem veredito de certo/errado.
  await semVeredito(page);
});
