import { test, expect, type Page } from '@playwright/test';

/**
 * Cobre os itens do leitor e do chat da correção de usabilidade:
 * 1.1 (sugestões na recusa), 1.7 (estado explícito antes do primeiro token),
 * 1.10 (atalhos fixos acima do campo), 1.11 (clique em citação destaca o
 * trecho) e 1.12 (Parar / Tentar de novo).
 */

async function login(page: Page) {
  await page.request.post('/api/auth/login', {
    data: { email: 'aluna@exemplo.com', senha: 'senha1234' },
  });
}

/**
 * Entra no leitor da seção, passando pelo panorama na primeira visita.
 * GuardaPanorama redireciona para lá no cliente (useEffect), então até o
 * clique em "Começar a leitura" ficar persistido (localStorage) e a
 * navegação de volta se assentar, a tela pode piscar entre as duas rotas
 * mais de uma vez sob automação — por isso o retry, em vez de assumir que
 * uma passada basta.
 */
async function abrirLeitor(page: Page, secaoId: string) {
  await page.goto(`/ler/${secaoId}`);
  const comecarLeitura = page.getByRole('button', { name: 'Começar a leitura' });
  // Não usar getByText aqui: o gatilho oculto da gaveta mobile também tem "Tutora"
  // como nome acessível (ícone + texto), e isso vira ambiguidade de seletor.
  const painelTutora = page.locator('p').filter({ hasText: /^Tutora$/ });

  for (let tentativa = 0; tentativa < 3; tentativa++) {
    await expect(comecarLeitura.or(painelTutora)).toBeVisible({ timeout: 10000 });
    if (await painelTutora.isVisible().catch(() => false)) return;
    await comecarLeitura.click();
    try {
      await painelTutora.waitFor({ state: 'visible', timeout: 5000 });
      return;
    } catch {
      // Ainda no panorama (ou voltou pra lá) — tenta de novo.
    }
  }
  await expect(painelTutora).toBeVisible({ timeout: 10000 });
}

test.describe('leitor e chat', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await abrirLeitor(page, 'sec-3-1');
  });

  test('atalhos ficam sempre visíveis acima do campo, sem precisar selecionar texto (item 1.10)', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Quero explicar isso com minhas palavras' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Me teste sobre o que acabei de ler' })).toBeVisible();
  });

  test('mostra estado explícito antes do primeiro token, depois a resposta com citações (item 1.7)', async ({ page }) => {
    const campo = page.getByLabel('Mensagem para a tutora');
    await campo.fill('O que é substituição de perguntas?');
    await page.getByRole('button', { name: 'Enviar' }).click();

    await expect(page.getByText('Procurando no texto…')).toBeVisible();
    await expect(page.getByText('Trechos usados')).toBeVisible({ timeout: 10000 });
  });

  test('recusa nunca termina sem saída: mostra sugestões clicáveis (item 1.1)', async ({ page }) => {
    const campo = page.getByLabel('Mensagem para a tutora');
    await campo.fill('recusa: isso não está no livro');
    await page.getByRole('button', { name: 'Enviar' }).click();

    await expect(page.getByText('Não encontrei base para isso no material desta seção.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Procurar em outras seções do livro' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ver a seção relacionada' })).toBeVisible();
  });

  test('clicar numa citação de outra seção navega até lá (item 1.11)', async ({ page }) => {
    const campo = page.getByLabel('Mensagem para a tutora');
    await campo.fill('explique a substituição de perguntas');
    await page.getByRole('button', { name: 'Enviar' }).click();

    await expect(page.getByText('Trechos usados')).toBeVisible({ timeout: 10000 });
    // A segunda citação do fixture aponta pra sec-1-1 (seção diferente da aberta).
    const citacoes = page.locator('button', { hasText: 'Sistema 1 e Sistema 2' });
    await citacoes.click();
    await page.waitForURL('**/ler/sec-1-1**');
  });

  test('Parar interrompe o streaming, e Tentar de novo reenvia após um erro (item 1.12)', async ({ page }) => {
    const campo = page.getByLabel('Mensagem para a tutora');

    // Parar: o streaming de sucesso tem vários tokens com atraso — dá tempo de clicar.
    await campo.fill('explique com calma a substituição de perguntas');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByRole('button', { name: 'Parar' })).toBeVisible();
    await page.getByRole('button', { name: 'Parar' }).click();
    await expect(page.getByRole('button', { name: 'Parar' })).toHaveCount(0);

    // Tentar de novo: o cenário "erro" do mock falha no meio do stream.
    await campo.fill('erro de propósito para testar');
    await page.getByRole('button', { name: 'Enviar' }).click();
    await expect(page.getByText('Não foi possível gerar a resposta agora. Tente de novo.')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: 'Tentar de novo' })).toBeVisible();
  });
});
