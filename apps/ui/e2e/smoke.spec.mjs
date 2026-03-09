import { expect, test } from '@playwright/test';

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Create Next App|CV/i);
});

test('health page renders', async ({ page }) => {
  await page.goto('/health');
  await expect(page.getByText(/API Health/i)).toBeVisible();
});

test('architecture page renders', async ({ page }) => {
  await page.goto('/architecture');
  await expect(page.getByText(/CV Platform Architecture/i)).toBeVisible();
  await expect(page).toHaveURL(/\/architecture$/);
});

test('cv page hides edit controls for non-admin and shows user auth icon', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /Edit personal info/i })).toHaveCount(0);
  await expect(page.getByTestId('user-auth-menu-trigger')).toBeVisible();
});
