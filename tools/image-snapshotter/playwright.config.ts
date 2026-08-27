/**
 * Playwright config for the docs image-snapshotter capture pass.
 *
 * Determinism notes:
 *   - viewport: 1600x900 — wide enough that the IDE panel content area can
 *     host an 860x573 chart container with IDE chrome around it
 *   - chromium 1.44.1 (pinned by the Dockerfile playwright image)
 *   - single worker; we mutate JSON files on disk per-page
 */
import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';

// SNAPSHOTTER_BASE_URL is the IDE URL. The docs-snapshots compose pipeline
// injects `http://server:10000/ide/`; local invocations should set it to
// `http://localhost:10000/ide/` (or whatever a hand-started server uses).
const baseURL =
  process.env.SNAPSHOTTER_BASE_URL ?? 'http://localhost:10000/ide/';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  // Only match Playwright-style `*.spec.ts` files. Without this, Playwright's
  // default glob also picks up `*.test.ts` — which would drag in our vitest
  // unit-test files (e.g. `extract.test.ts`). Vitest's `@vitest/expect`
  // collides with Playwright's `expect` on `Symbol($$jest-matchers-object)`
  // the moment both are loaded into the same process, killing the runner.
  testMatch: /.*\.spec\.ts$/,
  // The capture pass mutates JSON envelopes on disk and we want strictly
  // serialized execution to make orphan-pruning correctness obvious.
  fullyParallel: false,
  workers: 1,
  timeout: 180 * 1000,
  expect: { timeout: 15000 },
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    actionTimeout: 0,
    navigationTimeout: 60 * 1000,
    baseURL,
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1600, height: 900 } },
    },
  ],
};

export default config;
