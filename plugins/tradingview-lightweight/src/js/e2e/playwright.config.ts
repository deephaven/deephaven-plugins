/**
 * Playwright config for the TVL end-to-end suite.
 *
 * Unlike the unit tests (jest, jsdom), these run the REAL plugin inside a real
 * Deephaven IDE in Chromium, so they catch wiring/serialization/render bugs the
 * unit tests can't. The Deephaven server is booted and torn down automatically
 * by the `webServer` block below — you just run `npm run test:e2e`.
 *
 * Prerequisite (one-time): `bash e2e/setup-venv.sh` to provision a venv with
 * deephaven-server + the plugin installed. See ../../../AGENTS.md.
 */
import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.TVL_E2E_PORT ?? '10000';
const baseURL = `http://localhost:${PORT}/ide/`;

// Browser resolution: prefer an explicit TVL_E2E_CHROMIUM, then a system
// Chromium (handy in sandboxes where `playwright install` can't reach the
// network), else fall back to Playwright's bundled browser (the CI path after
// `npx playwright install chromium`).
const systemChromium = process.env.TVL_E2E_CHROMIUM ?? '/usr/bin/chromium';
const executablePath = existsSync(systemChromium) ? systemChromium : undefined;

const isCI = process.env.CI != null && process.env.CI !== '';

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: false,
  workers: 1,
  timeout: 120 * 1000,
  expect: { timeout: 20 * 1000 },
  forbidOnly: isCI,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL,
    navigationTimeout: 60 * 1000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      executablePath,
      // --no-sandbox: required when running Chromium as root in the sandbox.
      args: ['--no-sandbox'],
    },
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1600, height: 1000 },
      },
    },
  ],
  webServer: {
    // cwd defaults to this config's directory (e2e/), and start-server.sh
    // resolves its own paths via BASH_SOURCE, so it is cwd-independent.
    command: 'bash start-server.sh',
    url: baseURL,
    timeout: 150 * 1000,
    // Reuse a server you already have up locally for fast iteration; in CI
    // always boot a fresh one.
    reuseExistingServer: !isCI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
