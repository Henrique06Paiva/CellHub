import { test, expect } from '@playwright/test';

test.describe('Automação E2E: Tela de Login', () => {

  test('Deve exibir o formulário de login corretamente e bloquear sem credenciais', async ({ page }) => {
    // Como os testes de backend podem estar off, apenas garantimos que a interface existe.
    // Navega para a home (que vai redirecionar para login caso não haja sessão)
    await page.goto('http://localhost:5173/login');

    // Valida UI
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
    await expect(page.getByPlaceholder('seu@email.com')).toBeVisible();

    // Tenta submeter vazio
    await page.getByRole('button', { name: /entrar/i }).click();

    // Valida que os alertas vermelhos pipocaram
    await expect(page.getByText('Por favor, informe o seu e-mail.')).toBeVisible();
  });

});
