import { expect, test } from '@playwright/test';

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/Create Next App|CV/i);
});

test('health page renders', async ({ page }) => {
  await page.goto('/health');
  await expect(page.getByText(/API Health/i)).toBeVisible();
});
