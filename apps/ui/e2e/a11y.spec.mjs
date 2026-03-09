import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  { url: '/', name: 'CV' },
  { url: '/architecture', name: 'Architecture' },
];

test.describe('accessibility audits', () => {
  for (const pageConfig of PAGES) {
    test(`${pageConfig.name} page has no detectable a11y violations`, async ({ page }) => {
      await page.goto(pageConfig.url);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    });
  }
});
