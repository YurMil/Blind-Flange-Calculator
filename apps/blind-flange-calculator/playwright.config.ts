import {defineConfig, devices} from '@playwright/test';

const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: `pnpm exec serve ../../static/utility-apps/blind-flange-calculator -l ${PORT} --no-request-logging`,
    url: `${BASE_URL}/app.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: {...devices['Desktop Chrome']},
    },
  ],
});
