// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for E2E testing FreestyleFiend frontend.
 * - Tests run on Chromium, Firefox, and WebKit
 * - Base URL: http://localhost:3000
 * - Traces on first retry
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  retries: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
