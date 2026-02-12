---
name: e2e-tests
description: Run Playwright end-to-end tests in Docker. Use when asked to run e2e tests, integration tests, Playwright tests, or browser tests.
---

# Running E2E Tests

Uses Playwright in Docker. Run from repo root.

## Commands

```bash
# Run all e2e tests (recommended - matches CI)
npm run e2e:docker -- --reporter=list

# Run specific test file
npm run e2e:docker -- ./tests/ui.spec.ts --reporter=list

# Run specific test by name
npm run e2e:docker -- ./tests/ui.spec.ts --grep="UI loads" --reporter=list

# Run in specific browser
npm run e2e:docker -- --project firefox ./tests/ui.spec.ts --reporter=list
```

## Update snapshots

```bash
npm run e2e:update-snapshots
npm run e2e:update-snapshots -- ./tests/ui.spec.ts
```

## Local debugging

```bash
npm run e2e:ui
```

## Test files

Located in `tests/*.spec.ts`

## Notes

- Docker must be running
- Takes ~30s to spin up container
- Use `e2e:docker` over `e2e` to match CI environment
- Use `--reporter=list` for readable terminal output instead of HTML report
- If permission errors after docker run: `sudo rm -rf test-results`
