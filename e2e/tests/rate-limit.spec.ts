import { test, expect } from '@playwright/test';

/**
 * Rate-limiting e2e spec.
 *
 * The playwright.config.ts starts the server with RATE_LIMIT_MAX=5 and
 * RATE_LIMIT_WINDOW_MS=3000 so this spec completes quickly and the 3-second
 * window resets before other specs that share the server are affected.
 *
 * Override those values via environment variables passed to the test runner
 * (they are forwarded to the webServer process via the config's env block).
 */

/**
 * Max requests per window as configured on the server under test.
 * Must match the RATE_LIMIT_MAX value forwarded to the webServer in
 * playwright.config.ts (default: 100).
 */
const SERVER_RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX ?? '100');
/**
 * Window duration in ms as configured on the server under test.
 * Must match the RATE_LIMIT_WINDOW_MS value forwarded to the webServer in
 * playwright.config.ts (default: 3000).
 */
const SERVER_RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? '3000');

const BASE_URL = 'http://localhost:3000';

test.describe('rate limiting', () => {
  /**
   * Wait for a clean window before running any rate-limit tests.
   * Previous UI specs may have consumed requests in the current window;
   * sleeping past the window boundary guarantees a fresh count of 0.
   */
  test.beforeAll(async () => {
    await new Promise<void>((resolve) => setTimeout(resolve, SERVER_RATE_LIMIT_WINDOW_MS + 200));
  });

  /**
   * After the rate-limit tests exhaust the window, poll until it resets so
   * subsequent specs (which share the same server) are not blocked.
   */
  test.afterAll(async ({ request: apiRequest }) => {
    // Poll until a non-exempt route is no longer rate-limited (max 1 window).
    const deadline = Date.now() + SERVER_RATE_LIMIT_WINDOW_MS + 1_000;
    while (Date.now() < deadline) {
      const probe = await apiRequest.get(`${BASE_URL}/api/notes?page=1&pageSize=1`);
      if (probe.status() !== 429) break;
      await new Promise<void>((resolve) => setTimeout(resolve, 100));
    }
  });

  test('returns 429 after exceeding the request limit; Retry-After header is present', async ({
    request: apiRequest,
  }) => {
    const responses: { status: number; retryAfter: string | null }[] = [];

    // Fire max+1 requests against a non-exempt API route.
    for (let i = 0; i <= SERVER_RATE_LIMIT_MAX; i += 1) {
      const res = await apiRequest.get(`${BASE_URL}/api/notes?page=1&pageSize=1&_rl=${i}`);
      responses.push({
        status: res.status(),
        retryAfter: res.headers()['retry-after'] ?? null,
      });
    }

    // The first SERVER_RATE_LIMIT_MAX requests must succeed (2xx).
    for (let i = 0; i < SERVER_RATE_LIMIT_MAX; i += 1) {
      expect(responses[i].status, `request ${i + 1} should be within limit (2xx)`).toBeLessThan(
        300,
      );
    }

    // The (max+1)th request must be rejected with 429.
    const over = responses[SERVER_RATE_LIMIT_MAX];
    expect(over.status, 'request over limit should be 429').toBe(429);
    expect(over.retryAfter, 'Retry-After header must be present on 429').not.toBeNull();
    const retryAfterSec = Number(over.retryAfter);
    expect(retryAfterSec, 'Retry-After must be a positive integer (seconds)').toBeGreaterThan(0);
  });

  test('GET /api/health is never rate-limited even after limit is exceeded', async ({
    request: apiRequest,
  }) => {
    // The previous test has already exhausted the window; health must still pass.
    for (let i = 0; i < 3; i += 1) {
      const res = await apiRequest.get(`${BASE_URL}/api/health`);
      expect(res.status(), `/api/health attempt ${i + 1} should be 200`).toBe(200);
      const body = (await res.json()) as unknown;
      expect(body).toMatchObject({ ok: true });
    }
  });

  test('normal responses resume after the window resets', async ({ request: apiRequest }) => {
    // Wait for the rate-limit window to expire.
    await new Promise<void>((resolve) => setTimeout(resolve, SERVER_RATE_LIMIT_WINDOW_MS + 500));

    const res = await apiRequest.get(`${BASE_URL}/api/notes?page=1&pageSize=1`);
    expect(res.status(), 'request after window reset should not be 429').not.toBe(429);
    expect(res.status(), 'request after window reset should be 2xx').toBeLessThan(300);
  });
});
