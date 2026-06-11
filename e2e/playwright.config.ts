import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  reporter: [['html', { outputFolder: 'playwright-report', open: 'never' }]],
  // Run all specs serially with a single worker. The entire e2e suite shares
  // one long-lived in-memory server (no DB isolation between tests), so
  // parallel workers race on the shared note list and cause flaky ordering /
  // pagination assertions.
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:3000',
    video: 'on',
    trace: 'on',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // start:prod (root) builds the SPA then boots Express serving web/dist.
    // RATE_LIMIT_MAX and RATE_LIMIT_WINDOW_MS are forwarded so the e2e suite
    // can run with a tighter window (e.g. RATE_LIMIT_MAX=5 RATE_LIMIT_WINDOW_MS=3000)
    // without affecting the default production values.
    command: 'npm run start:prod --prefix ..',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      // Use a tight window for e2e so the rate-limit spec runs quickly and the
      // window resets before other specs are affected.  Override via env var if
      // the production defaults are needed.
      // 100 req / 3 s: high enough that browser-driven UI tests (which are
      // inherently slow) never approach the limit, while keeping the window
      // short enough that the rate-limit spec's afterAll only needs to wait
      // ~3 seconds for the window to expire before other specs resume.
      // Override via env vars when needed.
      RATE_LIMIT_MAX: process.env.RATE_LIMIT_MAX ?? '100',
      RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS ?? '3000',
    },
  },
});
