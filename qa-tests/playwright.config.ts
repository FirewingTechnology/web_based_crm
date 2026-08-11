import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  timeout: 60000,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../test-results/html-report', open: 'never' }],
    ['json', { outputFile: '../test-results/test-results.json' }],
  ],
  use: {
    baseURL: 'https://realvion-official-site.onrender.com',
    trace: 'on',
    screenshot: 'on',
    video: 'off',
    headless: false,
    viewport: { width: 1440, height: 900 },
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  outputDir: '../test-results/artifacts',
});
