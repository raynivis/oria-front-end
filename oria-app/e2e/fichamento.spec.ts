import { test, expect, type Page } from '@playwright/test';

/**
 * Cobre os itens de fichamento da correção de usabilidade:
 * 2.2 (markdown renderizado, não literal), 2.4 (cabeçalho com procedência e
 * "Ver no texto"), 2.5 (geração assíncrona, sem prender a tela) e 2.6
 * (busca por texto na listagem).
 */

async function login(page: Page) {
  await page.request.post('/api/auth/login', {
    data: { email: 'aluna@exemplo.com', senha: 'senha1234' },
  });
}

test.describe('fichamento', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('geração assíncrona: mostra "gerando", depois o conteúdo com markdown renderizado (itens 2.2 e 2.5)', async ({ page }) => {
    await page.goto('/ler/sec-3-1');
    const comecarLeitura = page.getByRole('button', { name: 'Começar a leitura' });
    if (await comecarLeitura.isVisible().catch(() => false)) {
      await comecarLeitura.click();
      await page.waitForURL('**/ler/sec-3-1');
    }

    await page.getByRole('button', { name: 'Gerar fichamento desta seção' }).click();
    await page.waitForURL('**/fichamentos/**');

    // Não prende a tela num spinner bloqueante indefinido — mostra o estado e segue sozinho.
    await expect(page.getByText('Gerando fichamento…')).toBeVisible();

    // O mock resolve em ~3s; o toast "pronto" confirma que o poll percebeu sem reload manual.
    await expect(page.getByText('Fichamento pronto.')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Gerando fichamento…')).toHaveCount(0);

    // "## Dados citados" e a lista não podem aparecer como texto literal com "##"/"-" dentro
    // do editor (o histórico de versões, à parte, mostra markdown bruto de propósito).
    const editor = page.getByRole('textbox');
    await expect(editor.getByText('##', { exact: false })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Dados citados' })).toBeVisible();
  });

  test('cabeçalho mostra procedência, trecho original e link para o texto (item 2.4)', async ({ page }) => {
    // Fichamento de trecho já existente na fixture (fichamentoTrechoFixture).
    await page.goto('/fichamentos/fichamento-2');

    await expect(page.getByRole('heading', { name: 'Heurísticas e Vieses' })).toBeVisible();
    await expect(page.getByText('Mente e Decisão')).toBeVisible();
    await expect(page.getByText('Quando confrontamos uma questão difícil', { exact: false })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Ver no texto' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Copiar$/ })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Exportar esta ficha' })).toBeVisible();
  });

  test('busca por texto filtra a listagem (item 2.6)', async ({ page }) => {
    await page.goto('/fichamentos');
    const linhasAntes = await page.locator('main ul > li').count();
    expect(linhasAntes).toBeGreaterThan(0);

    await page.getByLabel('Buscar fichamentos por texto').fill('texto-que-nao-existe-em-nenhum-fichamento-xyz');
    await page.getByRole('button', { name: 'Buscar' }).click();
    await page.waitForURL('**/fichamentos?texto=**');

    await expect(page.getByText('Nenhum fichamento encontrado para esse filtro.')).toBeVisible();
  });
});
