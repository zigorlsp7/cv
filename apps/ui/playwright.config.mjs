import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.WEB_BASE_URL;
if (!baseURL) {
  throw new Error('WEB_BASE_URL is required for web smoke tests');
}

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
